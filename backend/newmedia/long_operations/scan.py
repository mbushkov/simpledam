import asyncio
from asyncio.tasks import Task
import logging
import os
import pathlib

from typing import Iterable, Set
from asyncio.futures import Future
from newmedia.communicator import Communicator
from newmedia.long_operation import LogCallback, LongOperation, Status, StatusCallback
from newmedia import backend_state
from newmedia import store
from newmedia.store import ImageFile


async def ThumbnailFile(image_file: ImageFile, communicator: Communicator):
  # TODO: improve the logic to correctly process RAW files with existing thumbnails.
  # We might want to rerender them sometimes.
  if image_file.preview_timestamp:
    return

  await backend_state.BACKEND_STATE.ChangePreviewQueueSize(1)

  try:
    thumbnail_file = await store.DATA_STORE.UpdateFileThumbnail(image_file.uid)
  finally:
    await backend_state.BACKEND_STATE.ChangePreviewQueueSize(-1)

  await communicator.SendWebSocketData({
      "action": "THUMBNAIL_UPDATED",
      "image": thumbnail_file.ToJSON(),
  })


async def ScanFilesBatch(paths: Iterable[str], communicator: Communicator) -> Iterable[Task]:

  async def DoNothing():
    pass

  coros = (store.DATA_STORE.RegisterFile(pathlib.Path(p)) for p in paths)
  results = await asyncio.gather(*coros, return_exceptions=True)
  tasks = []
  for p, r in zip(paths, results):
    if isinstance(r, Exception):
      logging.error("Failed processing %s: %s", p, r)
      await communicator.SendWebSocketData({
          "action": "FILE_REGISTRATION_FAILED",
          "path": str(p),
      })
      tasks.append(asyncio.create_task(DoNothing()))
    elif isinstance(r, ImageFile):
      await communicator.SendWebSocketData({
          "action": "FILE_REGISTERED",
          "image": r.ToJSON(),
      })
      tasks.append(asyncio.create_task(ThumbnailFile(r, communicator)))
    else:
      raise AssertionError("This else branch shouldn't have been reached.")

  return tasks


class ScanPathsOperation(LongOperation):

  def __init__(self, paths: Iterable[str], communicator: Communicator):
    super().__init__()
    self.paths = paths
    self.communicator = communicator

  async def Run(self, status_callback: StatusCallback, log_callback: LogCallback) -> None:
    paths_to_process = []

    for p in self.paths:
      logging.info("Scanning path: %s", p)
      if os.path.isdir(p):
        for root, _, files in os.walk(p):
          for f in files:
            _, ext = os.path.splitext(f)
            if ext.lower() in store.SUPPORTED_EXTENSIONS:
              path = str(pathlib.Path(root) / f)
              paths_to_process.append(path)
      else:
        paths_to_process.append(p)

    preview_tasks: Set["Future"] = set()
    batch_size = 8
    paths = sorted(paths_to_process)
    for i in range(0, len(paths), batch_size):
      chunk = paths[i:i + batch_size]

      await status_callback(Status(f"Processing {chunk[0]}", float(i) / len(paths_to_process) * 50))
      new_tasks = await ScanFilesBatch(chunk, self.communicator)
      preview_tasks.update(new_tasks)

    logging.info("Got %d preview tasks.", len(preview_tasks))
    while True:
      done, pending = await asyncio.wait(preview_tasks, return_when=asyncio.FIRST_COMPLETED)
      await status_callback(
          Status(f"Thumbnail {len(done)} out of {len(preview_tasks)}",
                 float(len(done)) / len(preview_tasks) * 50 + 50))
      if not pending:
        break
      preview_tasks = pending

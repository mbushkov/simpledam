import asyncio
from asyncio.tasks import Task
import logging
import os
import pathlib

from typing import AsyncIterator, Iterable, Set
from asyncio.futures import Future
from newmedia.communicator import Communicator
from newmedia.long_operation import LongOperation, LongOperationStatus
from newmedia import backend_state
from newmedia import store


async def ScanFile(path: str, communicator: Communicator):
  try:
    image_file = await store.DATA_STORE.RegisterFile(pathlib.Path(path))
    await communicator.SendWebSocketData({
        "action": "FILE_REGISTERED",
        "image": image_file.ToJSON(),
    })
  except store.ImageProcessingError:
    await communicator.SendWebSocketData({
        "action": "FILE_REGISTRATION_FAILED",
        "path": str(path),
    })
    return None

  async def Thumbnail(image_file):
    try:
      thumbnail_file = await store.DATA_STORE.UpdateFileThumbnail(image_file.uid)
    finally:
      await backend_state.BACKEND_STATE.ChangePreviewQueueSize(-1)

    await communicator.SendWebSocketData({
        "action": "THUMBNAIL_UPDATED",
        "image": thumbnail_file.ToJSON(),
    })

  if not image_file.preview_timestamp:
    await backend_state.BACKEND_STATE.ChangePreviewQueueSize(1)
    await Thumbnail(image_file)


class ScanPathsOperation(LongOperation):

  def __init__(self, paths: Iterable[str], communicator: Communicator):
    super().__init__()
    self.paths = paths
    self.communicator = communicator

  async def Run(self) -> AsyncIterator[LongOperationStatus]:
    paths_to_process = []

    for p in self.paths:
      logging.info("Scanning path: %s", p)
      if os.path.isdir(p):
        for root, _, files in os.walk(p):
          for f in sorted(files):
            _, ext = os.path.splitext(f)
            if ext.lower() in store.SUPPORTED_EXTENSIONS:
              path = str(pathlib.Path(root) / f)
              paths_to_process.append(path)
      else:
        paths_to_process.append(p)

    preview_tasks: Set["Future"] = set()
    for i, p in enumerate(paths_to_process):
      yield LongOperationStatus(f"Processing {p}", float(i) / len(paths_to_process) * 50)
      logging.info("Found path: %s", p)
      preview_coro = ScanFile(p, self.communicator)
      if preview_coro is not None:
        preview_tasks.add(asyncio.create_task(preview_coro))
      logging.info("Processing done.")

    while True:
      done, pending = await asyncio.wait(preview_tasks, return_when=asyncio.FIRST_COMPLETED)
      yield LongOperationStatus(f"Thumbnail {len(done)} out of {len(preview_tasks)}",
                                float(len(done)) / len(preview_tasks) * 50 + 50)
      if not pending:
        break
      preview_tasks = pending

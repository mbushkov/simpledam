import asyncio
import logging

from typing import AsyncIterator
from newmedia import store
from newmedia.long_operation import LogCallback, LongOperation, Status, StatusCallback
from newmedia.utils.json_type import JSON


class SaveOperation(LongOperation):

  def __init__(self, state: JSON, path: str):
    super().__init__()
    self.state = state
    self.path = path

  async def Run(self, status_callback: StatusCallback, log_callback: LogCallback) -> None:
    logging.info("Saving to: %s", self.path)

    q: asyncio.Queue = asyncio.Queue()

    async def Progress(p: float):
      await q.put(p)

    loop = asyncio.get_running_loop()
    save_task = asyncio.create_task(
        store.DATA_STORE.SaveStore(
            self.path,
            self.state,
            progress=lambda p: asyncio.run_coroutine_threadsafe(Progress(p), loop)))

    while True:
      get_task = asyncio.create_task(q.get())
      done, _ = await asyncio.wait([save_task, get_task], return_when=asyncio.FIRST_COMPLETED)
      if save_task in done:
        return
      else:
        await status_callback(Status("Saving", get_task.result()))

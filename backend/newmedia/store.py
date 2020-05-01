import asyncio
import bson
import concurrent.futures
import dataclasses
import io
import pathlib
import uuid

from typing import Iterator

import cv2


class Error(Exception):
  pass


class ImageProcessingError(Error):
  pass


@dataclasses.dataclass
class Size:
  width: int
  height: int


@dataclasses.dataclass
class ImageFile:
  path: str
  uid: str
  size: Size
  preview_size: Size
  preview: bytes

  def JsonSummary(self):
    return {
        "path": self.path,
        "uid": self.uid,
        "size": dataclasses.asdict(self.size),
        "preview_size": dataclasses.asdict(self.preview_size),
    }


MAX_DIMENSION = 1600


def _ProcessFile(path: pathlib.Path) -> ImageFile:
  orig_img = cv2.imread(str(path), cv2.IMREAD_COLOR)
  if orig_img is None:
    raise ImageProcessingError("Can't process original file: %s", path)

  height, width, depth = orig_img.shape
  scale_factor = max(width, height) / 1600
  target_width = int(width / scale_factor)
  target_height = int(height / scale_factor)
  new_img = cv2.resize(orig_img, (target_width, target_height))

  retval, buffer = cv2.imencode(".jpg", new_img)
  preview_bytes = buffer.tobytes()

  return ImageFile(
      str(path),
      uuid.uuid4().hex,
      Size(width, height),
      Size(target_width, target_height),
      preview_bytes,
  )


class DataStore:

  _MEM_STORE = {}
  _THREAD_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=2)

  async def RegisterFile(self, path: pathlib.Path) -> ImageFile:
    loop = asyncio.get_running_loop()

    try:
      result = await loop.run_in_executor(self._THREAD_POOL, _ProcessFile, path)
    except cv2.error as e:
      raise ImageProcessingError(e)

    serialized = bson.dumps(dataclasses.asdict(result))

    self._MEM_STORE[result.uid] = serialized
    return result

  async def ReadFile(self, uid: str) -> io.BufferedIOBase:
    serialized = self._MEM_STORE[uid]
    data = bson.loads(serialized)
    return io.BytesIO(data["preview"])


DATA_STORE = DataStore()
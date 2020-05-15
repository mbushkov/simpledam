import asyncio
import concurrent.futures
import dataclasses
import io
import os
import pathlib
import time
import uuid
from typing import Iterator, Optional, Tuple

import aiosqlite
import bson
from PIL import Image


class Error(Exception):
  pass


class ImageProcessingError(Error):
  pass


class NotFoundError(Error):
  pass


@dataclasses.dataclass
class Size:
  width: int
  height: int

  @classmethod
  def FromJSON(cls, data):
    if not data:
      return None
    else:
      return Size(data["width"], data["height"])

  def ToJSON(self):
    return dataclasses.asdict(self)


@dataclasses.dataclass
class ImageFile:
  path: str
  uid: str
  size: Size
  preview_size: Optional[Size]
  preview_timestamp: Optional[int]

  @classmethod
  def FromJSON(cls, data):
    return ImageFile(
        data["path"],
        data["uid"],
        Size.FromJSON(data["size"]),
        Size.FromJSON(data["preview_size"]),
        data["preview_timestamp"],
    )

  def ToJSON(self):
    return dataclasses.asdict(self)


MAX_DIMENSION = 1600


def _GetFileInfo(path: pathlib.Path, prev_info: Optional[ImageFile]) -> ImageFile:
  try:
    im = Image.open(path)
    stat = os.stat(path)
  except IOError as e:
    raise ImageProcessingError(e)

  uid = prev_info and prev_info.uid or uuid.uuid4().hex
  if prev_info and prev_info.preview_timestamp and (stat.st_mtime * 1000 >
                                                    prev_info.preview_timestamp):
    prev_info = None

  try:
    width, height = im.size
    return ImageFile(
        str(path),
        uid,
        Size(width, height),
        prev_info and prev_info.preview_size or None,
        prev_info and prev_info.preview_timestamp or None,
    )
  finally:
    im.close()


def _ThumbnailFile(image_file: ImageFile) -> Tuple[ImageFile, bytes]:
  try:
    im = Image.open(image_file.path)
  except IOError as e:
    raise ImageProcessingError(e)

  try:
    width, height = im.size
    im.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
    target_width, target_height = im.size

    out = io.BytesIO()
    im.save(out, format='JPEG')

    return (
        ImageFile(
            image_file.path,
            image_file.uid,
            Size(width, height),
            Size(target_width, target_height),
            int(time.time() * 1000),
        ),
        out.getvalue(),
    )
  finally:
    im.close()


class DataStore:

  def __init__(self, db_path: Optional[pathlib.Path] = None):
    self._info_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
    self._thumbnail_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=2)
    self._db_path = db_path or ":memory:"
    self._conn = None

  async def _GetConn(self):
    if self._conn is None:
      self._conn = await aiosqlite.connect(self._db_path)
      await self._conn.executescript("""
CREATE TABLE IF NOT EXISTS ImageData (
    uid TEXT PRIMARY KEY,
    path TEXT,
    info BLOB NOT NULL,
    blob BLOB
);

CREATE UNIQUE INDEX IF NOT EXISTS ImageData_path_index
ON ImageData(path);
""")
      await self._conn.commit()

    return self._conn

  async def RegisterFile(self, path: pathlib.Path) -> ImageFile:
    loop = asyncio.get_running_loop()

    prev_info = None
    prev_blob = None
    conn = await self._GetConn()
    async with conn.execute("SELECT info, blob FROM ImageData WHERE path = ?",
                            (str(path),)) as cursor:
      async for row in cursor:
        prev_info = ImageFile.FromJSON(bson.loads(row[0]))
        prev_blob = row[1]

    result = await loop.run_in_executor(self._info_thread_pool, _GetFileInfo, path, prev_info)
    serialized = bson.dumps(result.ToJSON())

    await conn.execute_insert(
        """
INSERT OR REPLACE INTO ImageData(uid, path, info, blob)
VALUES (?, ?, ?, ?)
      """, (result.uid, str(result.path), serialized, prev_blob))
    await conn.commit()

    return result

  async def UpdateFileThumbnail(self, uid: str):
    loop = asyncio.get_running_loop()
    image_file = await self.ReadFileInfo(uid)

    updated_image_file, blob = await loop.run_in_executor(self._thumbnail_thread_pool,
                                                          _ThumbnailFile, image_file)
    serialized = bson.dumps(updated_image_file.ToJSON())

    conn = await self._GetConn()
    await conn.execute_insert("""
UPDATE ImageData
SET info=?,
    blob=?
WHERE uid=?
      """, (serialized, blob, uid))
    await conn.commit()

    return updated_image_file

  async def ReadFileInfo(self, uid: str) -> ImageFile:
    conn = await self._GetConn()
    async with conn.execute("SELECT info FROM ImageData WHERE uid = ?", (uid,)) as cursor:
      async for row in cursor:
        data = bson.loads(row[0])
        return ImageFile.FromJSON(data)

    raise NotFoundError(uid)

  async def ReadFileBlob(self, uid: str):
    conn = await self._GetConn()
    async with conn.execute("SELECT blob FROM ImageData WHERE uid = ?", (uid,)) as cursor:
      async for row in cursor:
        return io.BytesIO(row[0])

    raise NotFoundError(uid)


DATA_STORE: DataStore


def InitDataStore(path: Optional[pathlib.Path] = None) -> None:
  global DATA_STORE
  DATA_STORE = DataStore(path)
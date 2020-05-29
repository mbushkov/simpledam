import asyncio
import concurrent.futures
import dataclasses
import io
import logging
import os
import pathlib
import time
import uuid
from typing import Any, Dict, Iterator, Optional, Tuple

import aiosqlite
import bson
from PIL import Image, ImageMath

from newmedia import backend_state


class Error(Exception):
  pass


class ImageProcessingError(Error):
  pass


class NotFoundError(Error):
  pass


class SourceFileNotFoundError(NotFoundError):
  pass


class DestinationDirNotFoundError(NotFoundError):
  pass


class DestinationIsNotDirError(Error):
  pass


class DestinationFileExistsError(Error):
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
    # Grayscale tiffs first have to be normalized to have values ranging from 0 to 255 (IIUC, floating point values are ok).
    if im.mode.startswith("I;"):
      im = im.convert("F")
      im = ImageMath.eval('im/256', {'im': im}).convert('L')
    im = im.convert("RGB")
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

    self._db_path = db_path and str(db_path) or ""
    self._conn = None

  async def _InitSchema(self):
    await self._conn.executescript("""
  CREATE TABLE IF NOT EXISTS RendererState (
    id TEXT PRIMARY KEY,
    blob BLOB
  );

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

  async def _GetConn(self):
    if self._conn is not None:
      return self._conn

    backend_state.BACKEND_STATE.catalog_path = self._db_path
    self._conn = await aiosqlite.connect(self._db_path)

    if self._db_path:
      logging.info("Reading %s into a temporary db.", self._db_path)
      copy_conn = await aiosqlite.connect("")

      def Progress(status, remaining, total):
        remaining = remaining or 1
        total = total or 1
        logging.info("Loading file: %s %d %d", status, remaining, total)
        backend_state.BACKEND_STATE.SetCatalogOpProgress("load", 1 - round(remaining / total * 100))

      def Backup():
        self._conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

      await self._conn._execute(Backup)
      await self._conn.close()
      backend_state.BACKEND_STATE.SetCatalogOpProgress(None, None)

      self._conn = copy_conn

    await self._InitSchema()

    return self._conn

  # TODO: hold a global lock of some kind while saving the store.
  # At least make sure no new pictures are registered during the save.
  async def SaveStore(self, path, renderer_state_json):
    self._db_path = path

    serialized = bson.dumps(renderer_state_json)
    conn = await self._GetConn()
    await conn.execute_insert(
        """
INSERT OR REPLACE INTO RendererState(id, blob)
VALUES ('state', ?)
      """, (serialized,))
    await conn.commit()

    copy_conn = await aiosqlite.connect(self._db_path)

    def Progress(status, remaining, total):
      remaining = remaining or 1
      total = total or 1
      logging.info("Saving file: %s %d %d", status, remaining, total)
      backend_state.BACKEND_STATE.SetCatalogOpProgress("save", 1 - round(remaining / total * 100))

    def Backup():
      conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

    await conn._execute(Backup)
    await copy_conn.close()
    backend_state.BACKEND_STATE.SetCatalogOpProgress(None, None)
    backend_state.BACKEND_STATE.catalog_path = path

  async def GetSavedState(self) -> Optional[Dict[str, Any]]:
    conn = await self._GetConn()
    cur_state = None
    async with conn.execute("SELECT blob FROM RendererState", []) as cursor:
      async for row in cursor:
        cur_state = bson.loads(row[0])

    return cur_state

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

  async def MoveFile(self, src: pathlib.Path, dest: pathlib.Path) -> ImageFile:
    conn = await self._GetConn()

    if not src.exists() or not src.is_file():
      raise SourceFileNotFoundError(src)

    if dest.exists():
      raise DestinationFileExistsError(dest)

    dest_dir = pathlib.Path(*dest.parents)
    if not dest_dir.exists() or not dest_dir.is_dir():
      raise DestinationDirNotFoundError(dest_dir)

    uid = None
    image_file = None
    async with conn.execute("SELECT uid, info FROM ImageData WHERE path = ?",
                            (str(src),)) as cursor:
      async for row in cursor:
        uid = row[0]
        data = bson.loads(row[1])
        image_file = ImageFile.FromJSON(data)

    logging.info(f"Moving file (uid={uid}): {src} -> {dest}")
    if image_file is None:
      src.replace(dest)
      return await self.RegisterFile(dest)
    else:
      os.rename(src, dest)
      image_file.path = str(dest)
      serialized = bson.dumps(image_file.ToJSON())
      await conn.execute_insert("UPDATE ImageData SET path = ?, info = ? WHERE uid = ?", (
          str(dest),
          serialized,
          uid,
      ))
      await conn.commit()
      return image_file

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

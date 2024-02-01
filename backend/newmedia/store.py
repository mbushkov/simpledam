import asyncio
import io
import logging
import os
import pathlib
from typing import Any, Callable, Dict, List, Optional, cast

import aiosqlite
import bson

from newmedia import backend_state
from newmedia import image_processor
from newmedia import store_migration
from newmedia import store_schema
from newmedia.migrations import migration_0001
from newmedia.migrations import migration_0002


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


class DataStore:

  def __init__(self, db_path: Optional[pathlib.Path] = None):
    self._db_path = db_path and str(db_path) or ""
    self._conn: Optional[aiosqlite.Connection] = None
    self._conn_lock = asyncio.Lock()

  async def _GetConnImpl(self) -> aiosqlite.Connection:
    if self._conn is not None:
      return self._conn

    await backend_state.BACKEND_STATE.ChangeCatalogPath(self._db_path)
    self._conn = await aiosqlite.connect(self._db_path)

    if self._db_path:
      logging.info("Reading %s into a temporary db.", self._db_path)
      copy_conn = await aiosqlite.connect("")

      def Progress(status, remaining, total):
        remaining = remaining or 1
        total = total or 1
        logging.info("Loading file: %s %d %d", status, remaining, total)

      def Backup():
        # self._conn can't be None as Backup is meant to be executed within the
        # connection.
        assert self._conn is not None
        self._conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

      await self._conn._execute(Backup)
      await self._conn.close()

      self._conn = copy_conn

    await store_migration.RunMigrations(self._conn, [
        migration_0001.Migration0001(),
        migration_0002.Migration0002(),
    ])

    return self._conn
  
  async def _GetConn(self) -> aiosqlite.Connection:
    async with self._conn_lock:
      return await self._GetConnImpl()

  async def Close(self) -> None:
    assert self._conn is not None
    await self._conn.close()

  # TODO: hold a global lock of some kind while saving the store.
  # At least make sure no new pictures are registered during the save.
  async def SaveStore(self,
                      path,
                      renderer_state_json,
                      progress: Optional[Callable[[float], Any]] = None):
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
      if progress is not None:
        progress(1 - float(remaining) / total)

    def Backup():
      conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

    await conn._execute(Backup)
    await copy_conn.close()
    await backend_state.BACKEND_STATE.ChangeCatalogPath(path)

  async def GetSchema(self) -> str:
    conn = await self._GetConn()
    result = []
    async with conn.execute("SELECT sql FROM sqlite_schema", []) as cursor:
      async for row in cursor:
        if row[0] is not None:
          result.append(row[0])

    return "\n".join(result)

  async def GetSavedState(self) -> Optional[Dict[Any, Any]]:
    conn = await self._GetConn()
    cur_state = None
    async with conn.execute("SELECT blob FROM RendererState", []) as cursor:
      async for row in cursor:
        cur_state = bson.loads(row[0])

    return cast(Optional[Dict[Any, Any]], cur_state)

  async def RegisterFile(self, path: pathlib.Path) -> store_schema.ImageFile:
    loop = asyncio.get_running_loop()

    prev_info = None
    prev_blob = None
    conn = await self._GetConn()
    async with conn.execute("SELECT info FROM ImageData WHERE path = ?",
                            (str(path),)) as cursor:
      async for row in cursor:
        prev_info = store_schema.ImageFile.FromJSON(bson.loads(row[0]))
        prev_blob = row[1]

    result, preview_bytes = await image_processor.IMAGE_PROCESSOR.GetFileInfo(path, prev_info)
    serialized = bson.dumps(result.ToJSON())

    await conn.execute_insert(
        """
INSERT OR REPLACE INTO ImageData(uid, path, info)
VALUES (?, ?, ?)
      """, (result.uid, str(result.path), serialized))
    if result.previews:
      await conn.execute_insert(
          """
  INSERT OR REPLACE INTO ImagePreview(uid, width, height, blob)
  VALUES (?, ?, ?, ?)
        """, (result.uid, result.previews[0].preview_size.width, result.previews[0].preview_size.height, preview_bytes))
    await conn.commit()

    return result

  async def MoveFile(self, src: pathlib.Path, dest: pathlib.Path) -> store_schema.ImageFile:
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
        image_file = store_schema.ImageFile.FromJSON(data)

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
    image_file = await self.ReadFileInfo(uid)

    updated_image_file, preview_blobs = await image_processor.IMAGE_PROCESSOR.ThumbnailFile(image_file)
    serialized = bson.dumps(updated_image_file.ToJSON())

    conn = await self._GetConn()
    await conn.execute_insert("""
UPDATE ImageData
SET info=?
WHERE uid=?
      """, (serialized, uid))

    await conn.execute("""
    DELETE FROM ImagePreview WHERE uid = ?
    """, (uid,))
    for p, p_blob in zip(updated_image_file.previews, preview_blobs):
      await conn.execute_insert("""
      INSERT INTO ImagePreview(uid, width, height, blob)
      VALUES (?, ?, ?, ?)
        """, (uid, p.preview_size.width, p.preview_size.height, p_blob))

    await conn.commit()

    return updated_image_file

  async def ReadFileInfo(self, uid: str) -> store_schema.ImageFile:
    conn = await self._GetConn()
    async with conn.execute("SELECT info FROM ImageData WHERE uid = ?", (uid,)) as cursor:
      async for row in cursor:
        data = bson.loads(row[0])
        return store_schema.ImageFile.FromJSON(data)

    raise NotFoundError(uid)

  async def ReadFileBlob(self, uid: str):
    conn = await self._GetConn()
    async with conn.execute("SELECT blob FROM ImagePreview WHERE uid = ? LIMIT 1", (uid,)) as cursor:
      async for row in cursor:
        return io.BytesIO(row[0])

    raise NotFoundError(uid)


DATA_STORE: DataStore


def InitDataStore(path: Optional[pathlib.Path] = None) -> None:
  global DATA_STORE
  DATA_STORE = DataStore(path)

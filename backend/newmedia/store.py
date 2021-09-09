import asyncio
import concurrent.futures
import dataclasses
import io
import logging
import os
import pathlib
import time
import uuid
from typing import Any, Callable, Dict, List, Optional, Tuple, cast

import aiosqlite
import bson
from PIL import Image, ImageMath
import numpy
import rawpy
import tifffile  # allows low-level TIFF manipulation. Needed for formats not yet handled by PIL (16-bit color TIFFS)

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
class ImageFileV1:
  path: str
  uid: str
  size: Size
  preview_size: Optional[Size]
  preview_timestamp: Optional[int]

  @classmethod
  def FromJSON(cls, data):
    return ImageFileV1(
        data["path"],
        data["uid"],
        Size.FromJSON(data["size"]) or Size(0, 0),
        Size.FromJSON(data["preview_size"]) or Size(0, 0),
        data["preview_timestamp"],
    )

  def ToJSON(self):
    return dataclasses.asdict(self)


@dataclasses.dataclass
class ImageFilePreviewV2:
  preview_size: Size
  preview_timestamp: int

  @classmethod
  def FromJSON(cls, data):
    return ImageFilePreviewV2(
        Size.FromJSON(data["size"]) or Size(0, 0),
        data["preview_timestamp"],
    )

  def ToJSON(self):
    return {
        "preview_size": self.preview_size.ToJSON(),
        "preview_timestamp": self.preview_timestamp,
    }


@dataclasses.dataclass
class ImageFileV2:
  path: str
  uid: str
  size: Size
  previews: List[ImageFilePreviewV2]

  @classmethod
  def FromV1(cls, v1: ImageFileV1):
    previews = []
    if v1.preview_size and v1.preview_timestamp:
      previews.append(ImageFilePreviewV2(v1.preview_size, v1.preview_timestamp))

    return ImageFileV2(v1.path, v1.uid, v1.size, previews)

  @classmethod
  def FromJSON(cls, data):
    return ImageFileV2(
        data["path"],
        data["uid"],
        Size.FromJSON(data["size"]) or Size(0, 0),
        [ImageFilePreviewV2.FromJSON(v) for v in data["previews"]],
    )

  def ToJSON(self):
    return dataclasses.asdict(self)


ImageFile = ImageFileV1

MAX_DIMENSION = 3200

_SUPPORTED_PILLOW_EXTENSIONS = frozenset([
    ".jpg", ".jpeg", ".tif", ".tiff", ".png", ".bmp", ".gif", ".icns", ".ico", ".pcx", ".ppm",
    ".sgi", ".webp", ".xbm", ".psd", ".xpm"
])
_SUPPORTED_RAWPY_EXTENSIONS = frozenset([
    ".3fr", ".ari", ".arw", ".bay", ".braw", ".crw", ".cr2", ".cr3", ".cap", ".data", ".dcs",
    ".dcr", ".dng", ".drf", ".eip", ".erf", ".fff", ".gpr", ".iiq", ".k25", ".kdc", ".mdc", ".mef",
    ".mos", ".mrw", ".nef", ".nrw", ".obm", ".orf", ".pef", ".ptx", ".pxn", ".r3d", ".raf", ".raw",
    ".rwl", ".rw2", ".rwz", ".sr2", ".srf", ".srw", ".x3f"
])

SUPPORTED_EXTENSIONS = _SUPPORTED_PILLOW_EXTENSIONS | _SUPPORTED_RAWPY_EXTENSIONS


def _GetFileInfo(path: pathlib.Path, prev_info: Optional[ImageFile]) -> Tuple[ImageFile, bytes]:
  _, ext = os.path.splitext(path.name)
  ext = ext.lower()

  start_time = time.time()
  try:
    if ext in _SUPPORTED_PILLOW_EXTENSIONS:
      return _GetPillowFileInfo(path, prev_info=prev_info)
    elif ext in _SUPPORTED_RAWPY_EXTENSIONS:
      return _GetRawPyFileInfo(path, prev_info=prev_info)
    else:
      raise ValueError(f"Path {path} does not have a supported extension.")
  except Exception as e:
    logging.exception(e)
    raise
  finally:
    end_time = time.time()
    logging.info("GetFileInfo %s took %.2fs", path, end_time - start_time)


def _GetPillowFileInfo(path: pathlib.Path,
                       prev_info: Optional[ImageFile]) -> Tuple[ImageFile, bytes]:
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
    ), b""
  finally:
    im.close()


def _GetRawPyFileInfo(path: pathlib.Path,
                      prev_info: Optional[ImageFile]) -> Tuple[ImageFile, bytes]:
  try:
    stat = os.stat(path)
    with rawpy.imread(str(path)) as raw:
      sizes = raw.sizes

      preview_bytes = b""
      try:
        thumb = raw.extract_thumb()
      except rawpy.LibRawNoThumbnailError:  # type: ignore
        logging.info("No RAW thumbnail found: %s", path)
      except rawpy.LibRawUnsupportedThumbnailError:  # type: ignore
        logging.info("Unsupported RAW thumbnail: %s", path)
      else:
        if thumb.format == rawpy.ThumbFormat.JPEG:  # type: ignore
          preview_bytes = thumb.data
        elif thumb.format == rawpy.ThumbFormat.BITMAP:  # type: ignore
          logging.info("Ignoring non-JPEG RAW thumbnail: %s", path)
  except (IOError, rawpy.LibRawError) as e:  # type: ignore
    raise ImageProcessingError(e)

  preview_size = None
  preview_timestamp = None
  if preview_bytes:
    preview_bytes_io = io.BytesIO(preview_bytes)
    with Image.open(preview_bytes_io) as preview_img:
      preview_img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
      preview_size = Size(preview_img.width, preview_img.height)
      out = io.BytesIO()
      preview_img.save(out, format='JPEG')
      preview_bytes = out.getvalue()

    preview_timestamp = int(time.time() * 1000)
    logging.info("Found existing RAW preview, %dx%d (original %dx%d)", preview_size.width,
                 preview_size.height, sizes.width, sizes.height)

  uid = prev_info and prev_info.uid or uuid.uuid4().hex
  if prev_info and prev_info.preview_timestamp and (stat.st_mtime * 1000 >
                                                    prev_info.preview_timestamp):
    prev_info = None

  return ImageFile(
      str(path),
      uid,
      Size(sizes.width, sizes.height),
      preview_size or (prev_info and prev_info.preview_size) or None,
      preview_timestamp or (prev_info and prev_info.preview_timestamp) or None,
  ), preview_bytes


def _ThumbnailFile(image_file: ImageFile) -> Tuple[ImageFile, bytes]:
  logging.info("Thumbnailing file: %s", image_file.path)

  _, ext = os.path.splitext(image_file.path)
  ext = ext.lower()

  start_time = time.time()
  try:
    if ext in _SUPPORTED_PILLOW_EXTENSIONS:
      return _ThumbnailPillowFile(image_file)
    elif ext in _SUPPORTED_RAWPY_EXTENSIONS:
      return _ThumbnailRawPyFile(image_file)
    else:
      raise ValueError(f"Path {image_file.path} does not have a supported extension.")
  finally:
    end_time = time.time()
    logging.info("ThumbnailFile %s took %.2fs", image_file.path, end_time - start_time)


def _ThumbnailPillowFile(image_file: ImageFile) -> Tuple[ImageFile, bytes]:
  try:
    im = Image.open(image_file.path)
    # Grayscale tiffs first have to be normalized to have values ranging from 0 to 255 (IIUC, floating point values are ok).
    if im.mode == "RGBA":
      back = Image.new('RGBA', im.size, color="palegreen")
      im = Image.alpha_composite(back, im)
    elif im.mode == "RGBX" and im.format == "TIFF":
      np: numpy.ndarray = tifffile.imread(image_file.path)  # type: ignore
      # PIL doesn't support 16-bit-per-channel images well, but we can convert it to 8-bit images - that should be enough
      # for preview purposes.
      if np.dtype == "uint16":
        # fun note: using np / 16 produces an interesting color effect
        np = (np / 256).astype("uint8")  # type: ignore
      else:
        np = np.astype("uint8")  # type: ignore

      if np.shape[2] == 4:
        im = Image.fromarray(np, "RGBA")
        # Consider applying a transparency mask here.
        # NOTE: applying/not applying transparency should, ideally, be configurable when previews are generated.
      elif np.shape[2] == 3:
        im = Image.fromarray(np, "RGB")
    elif im.mode.startswith("I;"):
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


def _ThumbnailRawPyFile(image_file: ImageFile) -> Tuple[ImageFile, bytes]:
  try:
    with rawpy.imread(image_file.path) as raw:
      rgb = raw.postprocess(
          half_size=True,
          output_bps=8,
          use_camera_wb=True,
      )
      im = Image.fromarray(rgb)
  except (IOError, rawpy.LibRawError) as e:  # type: ignore
    logging.exception(e)
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
        self._conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

      await self._conn._execute(Backup)
      await self._conn.close()

      self._conn = copy_conn

    await self._InitSchema()

    return self._conn

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
      progress(1 - float(remaining) / total)

    def Backup():
      conn._conn.backup(copy_conn._conn, pages=100, progress=Progress)

    await conn._execute(Backup)
    await copy_conn.close()
    await backend_state.BACKEND_STATE.ChangeCatalogPath(path)

  async def GetSavedState(self) -> Optional[Dict[Any, Any]]:
    conn = await self._GetConn()
    cur_state = None
    async with conn.execute("SELECT blob FROM RendererState", []) as cursor:
      async for row in cursor:
        cur_state = bson.loads(row[0])

    return cast(Optional[Dict[Any, Any]], cur_state)

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

    result, preview_bytes = await loop.run_in_executor(self._info_thread_pool, _GetFileInfo, path,
                                                       prev_info)
    serialized = bson.dumps(result.ToJSON())

    await conn.execute_insert(
        """
INSERT OR REPLACE INTO ImageData(uid, path, info, blob)
VALUES (?, ?, ?, ?)
      """, (result.uid, str(result.path), serialized, preview_bytes or prev_blob))
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

import asyncio
import concurrent.futures
import dataclasses
import io
import logging
import os
import pathlib
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple, cast

import exiv2
import numpy
import rawpy
import tifffile  # allows low-level TIFF manipulation. Needed for formats not yet handled by PIL (16-bit color TIFFS)
import xattr
from PIL import Image, ImageCms, ImageMath

from newmedia import store_schema


class Error(Exception):
  pass


class ImageProcessingError(Error):
  pass


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


def _Exiv2DataToImageMetadata(data: Any) -> store_schema.ImageFileMetadata:
  t = exiv2.TypeId
  return store_schema.ImageFileMetadata({
      v.tagName(): store_schema.MetadataValue(
          value=v.toString(),
          type_id=v.typeId(),
      )
      for v in data
      if v.typeId() in [
          t.asciiString,
          t.date,
          t.signedLong,
          t.signedRational,
          t.signedShort,
          t.string,
          t.tiffDouble,
          t.tiffFloat,
          t.tiffIfd,
          t.time,
          t.unsignedLong,
          t.unsignedRational,
          t.unsignedShort,
          t.xmpText,
      ] and v.count() <= 4
  })


def _GetFileInfo(path: pathlib.Path, prev_info: Optional[store_schema.ImageFile]) -> store_schema.ImageFile:
  _, ext = os.path.splitext(path.name)
  ext = ext.lower()

  start_time = time.time()
  try:
    try:
      image = exiv2.ImageFactory.open(str(path))
      image.readMetadata()
    except exiv2.Exiv2Error as e:
      raise ImageProcessingError(e) from e

    stat = os.stat(path)
    uid = prev_info and prev_info.uid or uuid.uuid4().hex

    attrs = xattr.xattr(path)
    try:
      finder_attrs = attrs['com.apple.FinderInfo']
      file_color_tag = store_schema.FileColorTag(finder_attrs[9] >> 1 & 7)
    except KeyError:
      file_color_tag = store_schema.FileColorTag.NONE

    icc_profile_description = ""
    if image.iccProfileDefined():
      with io.BytesIO(image.iccProfile().data().tobytes()) as f:
        profile = ImageCms.ImageCmsProfile(f)
      icc_profile_description = profile.profile.profile_description

    return store_schema.ImageFile(
        path=str(path),
        uid=uid,
        size=store_schema.Size(image.pixelWidth(), image.pixelHeight()),
        previews=[],

        file_size=stat.st_size,
        file_ctime=int(stat.st_ctime * 1000),
        file_mtime=int(stat.st_mtime * 1000),
        file_color_tag=store_schema.FileColorTag(file_color_tag),

        icc_profile_description=icc_profile_description,
        mime_type=image.mimeType(),
        exif_data=_Exiv2DataToImageMetadata(image.exifData()),
        xmp_data=_Exiv2DataToImageMetadata(image.xmpData()),
        iptc_data=_Exiv2DataToImageMetadata(image.iptcData()),
    )
  except Exception as e:
    logging.exception(e)
    raise
  finally:
    end_time = time.time()
    logging.info("GetFileInfo %s took %.2fs", path, end_time - start_time)


def _ThumbnailFile(image_file: store_schema.ImageFile) -> Tuple[store_schema.ImageFile, Tuple[bytes]]:
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


def _ThumbnailPillowFile(image_file: store_schema.ImageFile) -> Tuple[store_schema.ImageFile, Tuple[bytes]]:
  try:
    stat = os.stat(image_file.path)
  except IOError as e:
    raise ImageProcessingError(e)

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

    return dataclasses.replace(image_file,
                               size=store_schema.Size(width, height),
                               previews=[
                                   store_schema.ImageFilePreview(
                                       preview_size=store_schema.Size(target_width, target_height),
                                       preview_timestamp=int(time.time() * 1000))
                               ]), (out.getvalue(),)
  finally:
    im.close()


def _ThumbnailRawPyFile(image_file: store_schema.ImageFile) -> Tuple[store_schema.ImageFile, Tuple[bytes]]:
  try:
    stat = os.stat(image_file.path)
  except IOError as e:
    raise ImageProcessingError(e)

  try:
    with rawpy.imread(image_file.path) as raw:
      preview_bytes = b""
      target_width = 0
      target_height = 0
      try:
        thumb = raw.extract_thumb()
      except rawpy.LibRawNoThumbnailError:  # type: ignore
        logging.info("No RAW thumbnail found: %s", image_file.path)
      except rawpy.LibRawUnsupportedThumbnailError:  # type: ignore
        logging.info("Unsupported RAW thumbnail: %s", image_file.path)
      else:
        if thumb.format == rawpy.ThumbFormat.JPEG:  # type: ignore
          preview_bytes = thumb.data
        elif thumb.format == rawpy.ThumbFormat.BITMAP:  # type: ignore
          logging.info("Ignoring non-JPEG RAW thumbnail: %s", image_file.path)

      if preview_bytes:
        preview_bytes_io = io.BytesIO(preview_bytes)
        with Image.open(preview_bytes_io) as preview_img:
          preview_img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
          target_width = preview_img.width
          target_height = preview_img.height
          out = io.BytesIO()
          preview_img.save(out, format='JPEG')
          preview_bytes = out.getvalue()        
      else:
        rgb = raw.postprocess(
            half_size=True,
            output_bps=8,
            use_camera_wb=True,
        )
        with Image.fromarray(rgb) as im:
          im.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
          out = io.BytesIO()
          im.save(out, format='JPEG')
          preview_bytes = out.getvalue()
  except (IOError, rawpy.LibRawError) as e:  # type: ignore
    logging.exception(e)
    raise ImageProcessingError(e)

  return (
      dataclasses.replace(image_file,
                          previews=[
                              store_schema.ImageFilePreview(
                                  preview_size=store_schema.Size(target_width, target_height),
                                  preview_timestamp=int(time.time() * 1000))
                          ],
                          ),
      (out.getvalue(),),
  )


class ImageProcessor:
  def __init__(self):
    self._info_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
    self._thumbnail_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=2)

  async def GetFileInfo(self, path: pathlib.Path, prev_info: Optional[store_schema.ImageFile]) -> store_schema.ImageFile:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._info_thread_pool, _GetFileInfo, path,
                                      prev_info)

  async def ThumbnailFile(self, image_file: store_schema.ImageFile) -> Tuple[store_schema.ImageFile, Tuple[bytes]]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(self._thumbnail_thread_pool,
                                      _ThumbnailFile, image_file)


IMAGE_PROCESSOR: ImageProcessor


def InitImageProcessor() -> None:
  global IMAGE_PROCESSOR
  IMAGE_PROCESSOR = ImageProcessor()

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

import exifread
import exifread.utils
import numpy
import rawpy
import tifffile  # allows low-level TIFF manipulation. Needed for formats not yet handled by PIL (16-bit color TIFFS)
import xattr
from PIL import Image, ImageMath, ExifTags, TiffImagePlugin

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


def _GetFileInfo(path: pathlib.Path, prev_info: Optional[store_schema.ImageFile]) -> Tuple[store_schema.ImageFile, bytes]:
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


_EXIF_TAGS = dict((v, k) for k, v in ExifTags.TAGS.items())


def _PillowExifToExifData(tags: Image.Exif) -> store_schema.ExifData:
  result = store_schema.ExifData(
      make=tags.get(_EXIF_TAGS["Make"]),
      model=tags.get(_EXIF_TAGS["Model"]),
      orientation=tags.get(_EXIF_TAGS["Orientation"]),
      x_resolution=tags.get(_EXIF_TAGS["XResolution"]),
      y_resolution=tags.get(_EXIF_TAGS["YResolution"]),
      resolution_unit=tags.get(_EXIF_TAGS["ResolutionUnit"]),
      software=tags.get(_EXIF_TAGS["Software"]),
      datetime=tags.get(_EXIF_TAGS["DateTime"]),
      exposure_time=tags.get(_EXIF_TAGS["ExposureTime"]),
      f_number=tags.get(_EXIF_TAGS["FNumber"]),
      image_width=tags.get(_EXIF_TAGS["ImageWidth"]),
      image_height=tags.get(_EXIF_TAGS["ImageHeight"]),
      compression=tags.get(_EXIF_TAGS["Compression"]),
      photometric_interpretation=tags.get(_EXIF_TAGS["PhotometricInterpretation"]),

      # Tags used by Exif SubIFD
      exposure_program=tags.get(_EXIF_TAGS["ExposureProgram"]),
      iso_speed_ratings=tags.get(_EXIF_TAGS["ISOSpeedRatings"]),
      exif_version=tags.get(_EXIF_TAGS["ExifVersion"]),
      datetime_original=tags.get(_EXIF_TAGS["DateTimeOriginal"]),
      datetime_digitized=tags.get(_EXIF_TAGS["DateTimeDigitized"]),
      shutter_speed_value=tags.get(_EXIF_TAGS["ShutterSpeedValue"]),
      aperture_value=tags.get(_EXIF_TAGS["ApertureValue"]),
      brightness_value=tags.get(_EXIF_TAGS["BrightnessValue"]),
      exposure_bias_value=tags.get(_EXIF_TAGS["ExposureBiasValue"]),
      max_aperture_value=tags.get(_EXIF_TAGS["MaxApertureValue"]),
      subject_distance=tags.get(_EXIF_TAGS["SubjectDistance"]),
      metering_mode=tags.get(_EXIF_TAGS["MeteringMode"]),
      light_source=tags.get(_EXIF_TAGS["LightSource"]),
      flash=tags.get(_EXIF_TAGS["Flash"]),
      focal_length=tags.get(_EXIF_TAGS["FocalLength"]),
      exif_image_width=tags.get(_EXIF_TAGS["ExifImageWidth"]),
      exif_image_height=tags.get(_EXIF_TAGS["ExifImageHeight"]),
      focal_plane_x_resolution=tags.get(_EXIF_TAGS["FocalPlaneXResolution"]),
      focal_plane_y_resolution=tags.get(_EXIF_TAGS["FocalPlaneYResolution"]),

      # Tags used by IFD1 (thumbnail image)
      # Temporary don't set this - we have to deal with tuples.
      # bits_per_sample=tags.get(_EXIF_TAGS["BitsPerSample"]),
  )

  # Ensure that no wrapper classes are used (critical for JSON serialization).
  for f in dataclasses.fields(result):
    val = getattr(result, f.name)
    if isinstance(val, TiffImagePlugin.IFDRational):
      setattr(result, f.name, float(val))
  return result


def _GetPillowFileInfo(path: pathlib.Path,
                       prev_info: Optional[store_schema.ImageFile]) -> Tuple[store_schema.ImageFile, bytes]:
  try:
    im = Image.open(path)
    stat = os.stat(path)
  except IOError as e:
    raise ImageProcessingError(e)

  uid = prev_info and prev_info.uid or uuid.uuid4().hex
  if prev_info and prev_info.previews and max(p.preview_timestamp for p in prev_info.previews) < stat.st_mtime * 1000:
    prev_info = None

  attrs = xattr.xattr(path)
  try:
    finder_attrs = attrs['com.apple.FinderInfo']
    file_color_tag = store_schema.FileColorTag(finder_attrs[9] >> 1 & 7)
  except KeyError:
    file_color_tag = store_schema.FileColorTag.NONE

  try:
    width, height = im.size
    return store_schema.ImageFile(
        path=str(path),
        uid=uid,
        size=store_schema.Size(width, height),
        previews=[],
        file_ctime=int(stat.st_ctime * 1000),
        file_mtime=int(stat.st_mtime * 1000),
        file_color_tag=store_schema.FileColorTag(file_color_tag),
        exif_data=_PillowExifToExifData(im.getexif())
    ), b""
  finally:
    im.close()


def _ExifReadToExifData(tags: Dict[str, Any]) -> store_schema.ExifData:

  def _Get(key: str) -> Any:
    ret = tags.get(key)
    if ret is None:
      return None

    if isinstance(ret.values, list):
      result = ret.values[0]
    else:
      result = ret.values

    if isinstance(result, exifread.utils.Ratio):
      result = float(result)

    return result

  return store_schema.ExifData(
      make=_Get("Image Make"),
      model=_Get("Image Model"),
      orientation=_Get("Image Orientation"),
      x_resolution=_Get("Image XResolution"),
      y_resolution=_Get("Image YResolution"),
      resolution_unit=_Get("Image ResolutionUnit"),
      software=_Get("Image Software"),
      datetime=_Get("Image DateTime"),
      exposure_time=_Get("Image ExposureTime"),
      f_number=_Get("Image FNumber"),
      image_width=_Get("Image ImageWidth"),
      image_height=_Get("Image ImageHeight"),
      bits_per_sample=_Get("Image BitsPerSample"),
      compression=_Get("Image Compression"),
      photometric_interpretation=_Get("Image PhotometricInterpretation"),

      # Tags used by Exif SubIFD
      exposure_program=_Get("EXIF ExposureProgram"),
      iso_speed_ratings=_Get("EXIF ISOSpeedRatings"),
      exif_version=_Get("EXIF ExifVersion"),
      datetime_original=_Get("EXIF DateTimeOriginal"),
      datetime_digitized=_Get("EXIF DateTimeDigitized"),
      shutter_speed_value=_Get("EXIF ShutterSpeedValue"),
      aperture_value=_Get("EXIF ApertureValue"),
      brightness_value=_Get("EXIF BrightnessValue"),
      exposure_bias_value=_Get("EXIF ExposureBiasValue"),
      max_aperture_value=_Get("EXIF MaxApertureValue"),
      subject_distance=_Get("EXIF SubjectDistance"),
      metering_mode=_Get("EXIF MeteringMode"),
      light_source=_Get("EXIF LightSource"),
      flash=_Get("EXIF Flash"),
      focal_length=_Get("EXIF FocalLength"),
      exif_image_width=_Get("EXIF ExifImageWidth"),
      exif_image_height=_Get("EXIF ExifImageHeight"),
      focal_plane_x_resolution=_Get("EXIF FocalPlaneXResolution"),
      focal_plane_y_resolution=_Get("EXIF FocalPlaneYResolution"),
  )


def _GetRawPyFileInfo(path: pathlib.Path,
                      prev_info: Optional[store_schema.ImageFile]) -> Tuple[store_schema.ImageFile, bytes]:
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

  attrs = xattr.xattr(path)
  try:
    finder_attrs = attrs['com.apple.FinderInfo']
    file_color_tag = store_schema.FileColorTag(finder_attrs[9] >> 1 & 7)
  except KeyError:
    file_color_tag = store_schema.FileColorTag.NONE

  with open(path, "rb") as fd:
    exif_tags = exifread.process_file(fd, details=False)
  exif_data = _ExifReadToExifData(exif_tags)

  preview_size = None
  preview_timestamp = None
  if preview_bytes:
    preview_bytes_io = io.BytesIO(preview_bytes)
    with Image.open(preview_bytes_io) as preview_img:
      preview_img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
      preview_size = store_schema.Size(preview_img.width, preview_img.height)
      out = io.BytesIO()
      preview_img.save(out, format='JPEG')
      preview_bytes = out.getvalue()

    preview_timestamp = int(time.time() * 1000)
    logging.info("Found existing RAW preview, %dx%d (original %dx%d)", preview_size.width,
                 preview_size.height, sizes.width, sizes.height)

  uid = prev_info and prev_info.uid or uuid.uuid4().hex
  if prev_info and prev_info.previews and max(p.preview_timestamp for p in prev_info.previews) < stat.st_mtime * 1000:
    prev_info = None

  previews = []
  if preview_bytes and preview_size:
    previews.append(store_schema.ImageFilePreview(
        preview_size=preview_size,
        preview_timestamp=int(time.time() * 1000)
    ))
  return store_schema.ImageFile(
      str(path),
      uid,
      store_schema.Size(sizes.width, sizes.height),
      previews=previews,
      file_ctime=int(stat.st_ctime * 1000),
      file_mtime=int(stat.st_mtime * 1000),
      file_color_tag=store_schema.FileColorTag(file_color_tag),
      exif_data=exif_data,
  ), preview_bytes


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
        store_schema.ImageFile(
            path=image_file.path,
            uid=image_file.uid,
            size=store_schema.Size(width, height),
            previews=[
                store_schema.ImageFilePreview(
                    preview_size=store_schema.Size(target_width, target_height),
                    preview_timestamp=int(time.time() * 1000))
            ],
            file_color_tag=image_file.file_color_tag,
            file_ctime=image_file.file_ctime,
            file_mtime=image_file.file_mtime,
            exif_data=image_file.exif_data,
        ),
        (out.getvalue(),),
    )
  finally:
    im.close()


def _ThumbnailRawPyFile(image_file: store_schema.ImageFile) -> Tuple[store_schema.ImageFile, Tuple[bytes]]:
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
        store_schema.ImageFile(
            path=image_file.path,
            uid=image_file.uid,
            size=store_schema.Size(width, height),
            previews=[
                store_schema.ImageFilePreview(
                    preview_size=store_schema.Size(target_width, target_height),
                    preview_timestamp=int(time.time() * 1000))
            ],
            file_color_tag=image_file.file_color_tag,
            file_ctime=image_file.file_ctime,
            file_mtime=image_file.file_mtime,
            exif_data=image_file.exif_data,
        ),
        (out.getvalue(),),
    )
  finally:
    im.close()


class ImageProcessor:
  def __init__(self):
    self._info_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
    self._thumbnail_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=2)

  async def GetFileInfo(self, path: pathlib.Path, prev_info: Optional[store_schema.ImageFile]) -> Tuple[store_schema.ImageFile, bytes]:
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

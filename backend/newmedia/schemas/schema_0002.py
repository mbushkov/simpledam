import dataclasses
import enum
from typing import List, Optional

from newmedia.schemas import schema_0001


Size = schema_0001.Size


@dataclasses.dataclass
class ImageFilePreview:
  preview_size: Size
  preview_timestamp: int

  @classmethod
  def FromJSON(cls, data):
    return ImageFilePreview(
        Size.FromJSON(data["size"]) or Size(0, 0),
        data["preview_timestamp"],
    )

  def ToJSON(self):
    return {
        "preview_size": self.preview_size.ToJSON(),
        "preview_timestamp": self.preview_timestamp,
    }


@dataclasses.dataclass
class ExifData:
  # See https://www.media.mit.edu/pia/Research/deepview/exif.html

  # Tags used by IFD0 (main image)
  make: Optional[str]
  model: Optional[str]
  orientation: Optional[int]
  x_resolution: Optional[float]
  y_resolution: Optional[float]
  resolution_unit: Optional[int]
  software: Optional[str]
  datetime: Optional[str]
  exposure_time: Optional[float]
  f_number: Optional[float]

  # Tags used by Exif SubIFD
  exposure_program: Optional[int]
  iso_speed_ratings: Optional[int]
  exif_version: Optional[str]
  datetime_original: Optional[str]
  datetime_digitized: Optional[str]
  shutter_speed_value: Optional[float]
  aperture_value: Optional[float]
  brightness_value: Optional[float]
  exposure_bias_value: Optional[float]
  max_aperture_value: Optional[float]
  subject_distance: Optional[float]
  metering_mode: Optional[int]
  light_source: Optional[int]
  flash: Optional[int]
  focal_length: Optional[int]
  exif_image_width: Optional[int]
  exif_image_height: Optional[int]
  focal_plane_x_resolution: Optional[float]
  focal_plane_y_resolution: Optional[float]

  # Tags used by IFD1 (thumbnail image)
  image_width: Optional[int]
  image_height: Optional[int]
  bits_per_sample: Optional[int]
  compression: Optional[int]
  photometric_interpretation: Optional[int]

  @classmethod
  def FromJSON(cls, data):
    return ExifData(**(data or {}))

  def ToJSON(self):
    return dataclasses.asdict(self)


class FileColorTag(enum.IntEnum):
  NONE = 0
  GRAY = 1
  GREEN = 2
  PURPLE = 3
  BLUE = 4
  YELLOW = 5
  RED = 6
  ORANGE = 7


@dataclasses.dataclass
class ImageFile:
  path: str
  uid: str

  size: Size
  previews: List[ImageFilePreview]

  file_ctime: int = 0
  file_mtime: int = 0
  file_color_tag: FileColorTag = FileColorTag.NONE

  exif_data: Optional[ExifData] = None

  @classmethod
  def FromV1(cls, v1: schema_0001.ImageFile):
    previews = []
    if v1.preview_size and v1.preview_timestamp:
      previews.append(ImageFilePreview(v1.preview_size, v1.preview_timestamp))

    return ImageFile(
        path=v1.path,
        uid=v1.uid,
        size=v1.size,
        previews=previews)

  @classmethod
  def FromJSON(cls, data):
    return ImageFile(
        path=data["path"],
        uid=data["uid"],
        size=Size.FromJSON(data["size"]) or Size(0, 0),
        previews=[ImageFilePreview.FromJSON(v) for v in data["previews"]],
        file_ctime=data["file_ctime"],
        file_mtime=data["file_mtime"],
        file_color_tag=FileColorTag(data["file_color_tag"]),
        exif_data=ExifData.FromJSON(data["exif_data"]),
    )

  def ToJSON(self):
    return dataclasses.asdict(self)

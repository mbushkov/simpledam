import dataclasses
import datetime
import enum
import fractions
from typing import Any, List, Optional, Tuple

from newmedia.schemas import schema_0001
from newmedia.utils.json_type import JSON

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
class ExifData:
  # See https://www.media.mit.edu/pia/Research/deepview/exif.html

  # Tags used by IFD0 (main image)
  make: Optional[str] = None
  model: Optional[str] = None
  orientation: Optional[int] = None
  x_resolution: Optional[float] = None
  y_resolution: Optional[float] = None
  resolution_unit: Optional[int] = None
  software: Optional[str] = None
  date_time: Optional[datetime.datetime] = None
  exposure_time: Optional[float] = None
  f_number: Optional[float] = None

  # Tags used by Exif SubIFD
  exposure_program: Optional[int] = None
  iso_speed_ratings: Optional[int] = None
  exif_version: Optional[str] = None
  date_time_original: Optional[datetime.datetime] = None
  date_time_digitized: Optional[datetime.datetime] = None
  shutter_speed_value: Optional[float] = None
  aperture_value: Optional[float] = None
  brightness_value: Optional[float] = None
  exposure_bias_value: Optional[float] = None
  max_aperture_value: Optional[float] = None
  subject_distance: Optional[float] = None
  metering_mode: Optional[int] = None
  light_source: Optional[int] = None
  flash: Optional[int] = None
  focal_length: Optional[int] = None
  exif_image_width: Optional[int] = None
  exif_image_height: Optional[int] = None
  focal_plane_x_resolution: Optional[float] = None
  focal_plane_y_resolution: Optional[float] = None

  # Tags used by IFD1 (thumbnail image)
  image_width: Optional[int] = None
  image_height: Optional[int] = None
  bits_per_sample: Optional[int] = None
  compression: Optional[int] = None
  photometric_interpretation: Optional[int] = None

  # GPS Ifd tags (see https://www.awaresystems.be/imaging/tiff/tifftags/privateifd/gps.html)
  gps_version_id: Optional[str] = None
  gps_latitude_ref: Optional[str] = None
  gpa_latitude: Optional[Tuple[fractions.Fraction, fractions.Fraction, fractions.Fraction]] = None
  gps_longitude_ref: Optional[str] = None
  gps_longitude: Optional[Tuple[fractions.Fraction, fractions.Fraction, fractions.Fraction]] = None
  gps_altitude_ref: Optional[int] = None
  gps_altitude: Optional[fractions.Fraction] = None
  gps_time_stamp: Optional[Tuple[fractions.Fraction, fractions.Fraction, fractions.Fraction]] = None
  gps_date_stamp: Optional[datetime.datetime] = None

  @classmethod
  def FromJSON(cls, json_data: JSON) -> "ExifData":
    data: Any = json_data or {}

    date_keys = ["date_time", "date_time_original", "date_time_digitized", "gps_date_stamp"]
    for k in date_keys:
      if data.get(k):
        data[k] = datetime.datetime.strptime(data[k], "%Y:%m:%d %H:%M:%S")

    gps_keys = ["gpa_latitude", "gps_longitude", "gps_time_stamp"]
    for k in gps_keys:
      if data.get(k):
        data[k] = tuple(fractions.Fraction(i) for i in data[k])

    fraction_keys = ["gps_altitude"]
    for k in fraction_keys:
      if data.get(k):
        data[k] = fractions.Fraction(data[k])

    return ExifData(**(data or {}))

  def _AdaptJSON(self, data:Any) -> Any:
    for k, v in data.items():
      if isinstance(v, fractions.Fraction):
        data[k] = str(v)
      elif isinstance(v, datetime.datetime):
        data[k] = v.strftime("%Y:%m:%d %H:%M:%S")
      elif isinstance(v, (tuple, list)):
        data[k] = [self._AdaptJSON(i) for i in v]

    return data

  def ToJSON(self) -> JSON:
    return self._AdaptJSON(dataclasses.asdict(self))


@dataclasses.dataclass
class ImageFile:
  path: str
  uid: str

  size: Size
  previews: List[ImageFilePreview]

  file_size: int
  file_ctime: int
  file_mtime: int
  file_color_tag: FileColorTag

  icc_profile_description: str
  mime_type: str
  exif_data: ExifData

  @classmethod
  def FromV1(cls, v1: schema_0001.ImageFile):
    previews = []
    if v1.preview_size and v1.preview_timestamp:
      previews.append(ImageFilePreview(v1.preview_size, v1.preview_timestamp))

    return ImageFile(
        path=v1.path,
        uid=v1.uid,
        size=v1.size,
        previews=previews,
        
        file_size=0,
        file_ctime=0,
        file_mtime=0,
        file_color_tag=FileColorTag.NONE,
        
        icc_profile_description="",
        mime_type="",
        exif_data=ExifData(),
        )

  @classmethod
  def FromJSON(cls, data):
    return ImageFile(
        path=data["path"],
        uid=data["uid"],
        size=Size.FromJSON(data["size"]) or Size(0, 0),
        previews=[ImageFilePreview.FromJSON(v) for v in data["previews"]],
        file_size=data["file_size"],
        file_ctime=data["file_ctime"],
        file_mtime=data["file_mtime"],
        file_color_tag=FileColorTag(data["file_color_tag"]),
        icc_profile_description=data["icc_profile_description"],
        mime_type=data["mime_type"],
        exif_data=ExifData.FromJSON(data["exif_data"]),
    )

  def ToJSON(self):
    result = dataclasses.asdict(self)
    result["previews"] = [v.ToJSON() for v in self.previews]
    result["exif_data"] = self.exif_data.ToJSON()
    return result

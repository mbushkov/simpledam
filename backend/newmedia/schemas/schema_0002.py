import dataclasses
import datetime as datetime_lib
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
class MetadataValue:
  value: str
  type_id: int

  @classmethod
  def FromJSON(cls, data):
    return MetadataValue(data["value"], data["type_id"])

  def ToJSON(self):
    return dataclasses.asdict(self)


class ImageFileMetadata(dict[str, MetadataValue]):
  @classmethod
  def FromJSON(cls, data):
    return ImageFileMetadata({
        k: MetadataValue.FromJSON(v)
        for k, v in data.items()
    })

  def ToJSON(self):
    return {
        k: v.ToJSON()
        for k, v in self.items()
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
  exif_data: ImageFileMetadata
  xmp_data: ImageFileMetadata
  iptc_data: ImageFileMetadata

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
        exif_data=ImageFileMetadata(),
        xmp_data=ImageFileMetadata(),
        iptc_data=ImageFileMetadata(),
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
        exif_data=ImageFileMetadata.FromJSON(data["exif_data"]),
        xmp_data=ImageFileMetadata.FromJSON(data["xmp_data"]),
        iptc_data=ImageFileMetadata.FromJSON(data["iptc_data"]),
    )

  def ToJSON(self):
    return dataclasses.asdict(self)

import dataclasses
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
class ImageFile:
  path: str
  uid: str
  size: Size
  previews: List[ImageFilePreview]
  creation_timestamp: int
  modification_timestamp: int

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
        creation_timestamp=0,
        modification_timestamp=0)

  @classmethod
  def FromJSON(cls, data):
    return ImageFile(
        path=data["path"],
        uid=data["uid"],
        size=Size.FromJSON(data["size"]) or Size(0, 0),
        previews=[ImageFilePreview.FromJSON(v) for v in data["previews"]],
        creation_timestamp=data["creation_timestamp"],
        modification_timestamp=data["modification_timestamp"],
    )

  def ToJSON(self):
    return dataclasses.asdict(self)

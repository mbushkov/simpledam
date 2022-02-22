import dataclasses
from typing import List, Optional


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

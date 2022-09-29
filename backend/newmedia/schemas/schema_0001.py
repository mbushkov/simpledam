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
        Size.FromJSON(data["size"]) or Size(0, 0),
        Size.FromJSON(data["preview_size"]) or Size(0, 0),
        data["preview_timestamp"],
    )

  def ToJSON(self):
    return dataclasses.asdict(self)

# type: ignore
import base64
import dataclasses
from typing import Optional, Sequence

from AppKit import NSPNGFileType, NSCompositeCopy, NSGraphicsContext, NSCalibratedRGBColorSpace, NSBitmapImageRep, NSImage, NSImageNameComputer
import Cocoa
from Foundation import NSURL, NSZeroRect, NSMakeRect, NSMakeSize
import LaunchServices


class Error(Exception):
  pass


class FileNotFoundError(Error):
  pass


@dataclasses.dataclass
class OpenWithEntry:
  name: str
  icon: bytes

  def ToJSON(self):
    return {
        "name": self.name,
        "icon": base64.b64encode(self.icon).decode("ascii"),
    }


@dataclasses.dataclass
class OpenWithEntries:
  default: Optional[OpenWithEntry]
  other: Sequence[OpenWithEntry]

  def ToJSON(self):
    return {
        "default": self.default.ToJSON(),
        "other": [v.ToJSON() for v in self.other],
    }


def _NSImageToBytes(img: NSImage) -> bytes:
  dimension = 512
  size = NSMakeSize(dimension, dimension)
  rect = NSMakeRect(0, 0, dimension, dimension)
  img.setSize_(size)

  rep = NSBitmapImageRep.alloc()
  rep.initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(
      None, dimension, dimension, 8, 4, True, False, NSCalibratedRGBColorSpace, 0, 0)
  rep.setSize_(size)

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.setCurrentContext_(NSGraphicsContext.graphicsContextWithBitmapImageRep_(rep))
  img.drawInRect_fromRect_operation_fraction_(rect, NSZeroRect, NSCompositeCopy, 1.0)
  NSGraphicsContext.restoreGraphicsState()

  pngData = rep.representationUsingType_properties_(NSPNGFileType, None)
  return pngData.bytes()


def GetOpenWithEntries(path: str) -> OpenWithEntries:
  url = NSURL.fileURLWithPath_(path)
  if url is None:
    raise FileNotFoundError(f"Couldn't get URL for: {path}")

  defaultApp = LaunchServices.LSGetApplicationForURL(url, LaunchServices.kLSRolesAll, None,
                                                     None)[-1]
  allApps = LaunchServices.LSCopyApplicationURLsForURL(url, LaunchServices.kLSRolesAll)

  workspace = Cocoa.NSWorkspace.sharedWorkspace()
  defaultIcon = workspace.iconForFile_(defaultApp.path())
  allIcons = [workspace.iconForFile_(u.path()) for u in allApps]

  return OpenWithEntries(
      OpenWithEntry(defaultApp.path(), _NSImageToBytes(defaultIcon)),
      [OpenWithEntry(u.path(), _NSImageToBytes(i)) for u, i in zip(allApps, allIcons)])

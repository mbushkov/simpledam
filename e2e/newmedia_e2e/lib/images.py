import os
import shutil
import tempfile
from typing import cast
import unittest

from PIL import Image, ImageDraw


def CreateTempImages(t: unittest.TestCase, *, count: int) -> str:
  temp_dir = tempfile.mkdtemp()
  t.addCleanup(shutil.rmtree, temp_dir)

  for i in range(count):
    img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
    d = cast(ImageDraw.ImageDraw, ImageDraw.Draw(img))
    d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))

    img.save(os.path.join(temp_dir, "%d.png" % i))

  return temp_dir


def CreateTempImagesInFolders(t: unittest.TestCase, *, count: int) -> str:
  temp_dir = tempfile.mkdtemp()
  t.addCleanup(shutil.rmtree, temp_dir)

  for i in range(count):
    img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
    d = cast(ImageDraw.ImageDraw, ImageDraw.Draw(img))
    d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))

    img_dir = os.path.join(temp_dir, str(i))
    os.mkdir(img_dir)

    img.save(os.path.join(img_dir, "%d.png" % i))

  return temp_dir
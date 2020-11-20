import os
import shutil
import tempfile
from typing import cast

from PIL import Image, ImageDraw

from newmedia_e2e.lib import base, selectors


class FilteringTest(base.TestBase):

  NUM_IMAGES = 10

  def setUp(self):
    self.temp_dir = tempfile.mkdtemp()
    self.addCleanup(shutil.rmtree, self.temp_dir)

    for i in range(self.NUM_IMAGES):
      img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
      d = cast(ImageDraw.ImageDraw, ImageDraw.Draw(img))
      d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))

      img_dir = os.path.join(self.temp_dir, str(i))
      os.mkdir(img_dir)

      img.save(os.path.join(img_dir, "%d.png" % i))

  def testFiltersByPath(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    # Click on the path filter.
    path_0 = os.path.join(self.temp_dir, "0")
    b.Click(selectors.PathFilterRadioButton(path_0))

    b.WaitUntilCountEqual(1, selectors.ImageBoxes())
    b.WaitUntilPresent(selectors.ImageBoxWithTitle("0.png"))

    # Click on the same path filter again to remove it.
    b.Click(selectors.PathFilterRadioButton(path_0))
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

import os
import shutil
import tempfile
from typing import cast

from PIL import Image, ImageDraw

from newmedia_e2e.lib.base import BrowserWindow
from newmedia_e2e.lib import base


class ImageGridTest(base.TestBase):

  NUM_IMAGES = 10

  def setUp(self):
    self.temp_dir = tempfile.mkdtemp()
    self.addCleanup(shutil.rmtree, self.temp_dir)

    self.catalog = str(os.path.join(self.temp_dir, "c.nmcatalog"))

    for i in range(self.NUM_IMAGES):
      img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
      d = cast(ImageDraw.ImageDraw, ImageDraw.Draw(img))
      d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))
      img.save(os.path.join(self.temp_dir, "%d.png" % i))

  def testSavesAndLoadsImagesSet(self):
    b = self.CreateWindow(scan_path=self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, '.image-grid .image-box')
    b.app.TriggerAction("Save", self.catalog)
    b.WaitUntilPresent(".status-bar:contains('%s')" % self.catalog)
    b.Close()
    del b

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilPresent(".status-bar:contains('%s')" % self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, '.image-grid .image-box')

  def testSavesAndLoadsImageTransformations(self):
    pass

  def testSavesAndLoadsLabels(self):
    pass

  def testSavesAndLoadsRatins(self):
    pass

  def testSavesAndLoadsFilterSettingsAndSelection(self):
    pass
import contextlib
import os
import shutil
import tempfile
from typing import Iterator, cast

from PIL import Image, ImageDraw

from newmedia_e2e.lib.base import BrowserWindow
from newmedia_e2e.lib import base


class LoadSaveTest(base.TestBase):

  NUM_IMAGES = 10

  @contextlib.contextmanager
  def _FirstWindow(self) -> Iterator[BrowserWindow]:
    b = self.CreateWindow(scan_path=self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")
    yield b
    b.app.TriggerAction("Save", self.catalog)
    b.WaitUntilPresent(".status-bar:contains('%s')" % self.catalog)
    b.Close()

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
    with self._FirstWindow():
      pass

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilPresent(".status-bar:contains('%s')" % self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")

  def testSavesAndLoadsImageTransformations(self):
    pass

  def testSavesAndLoadsLabels(self):
    with self._FirstWindow() as b:
      images = b.GetDisplayedElements(".image-grid .image-box")

      b.Click(images[0])
      b.app.TriggerAction("LabelRed")
      b.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-red")

      b.Click(images[1])
      b.app.TriggerAction("LabelGreen")
      b.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-green")

      b.Click(images[2])
      b.app.TriggerAction("LabelBlue")
      b.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-blue")

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")

    images = b_new.GetDisplayedElements(".image-grid .image-box")
    b_new.Click(images[0])
    b_new.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-red")

    b_new.Click(images[1])
    b_new.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-green")

    b_new.Click(images[2])
    b_new.WaitUntilPresent(".image-grid .image-box.selected .has-text-label-blue")

  def testSavesAndLoadsRatings(self):
    pass

  def testSavesAndLoadsFilterSettingsAndSelection(self):
    pass
import contextlib
import os
from typing import Iterator

from newmedia_e2e.lib.base import BrowserWindow
from newmedia_e2e.lib import base, images, selectors


class LoadSaveTest(base.TestBase):

  NUM_IMAGES = 10

  @contextlib.contextmanager
  def _FirstWindow(self) -> Iterator[BrowserWindow]:
    b = self.CreateWindow(scan_path=self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())
    yield b
    b.app.TriggerAction("Save", self.catalog)
    b.WaitUntilPresent(selectors.StatusBarWithText(self.catalog))
    b.Close()

  def setUp(self):
    self.temp_dir = images.CreateTempImages(self)
    self.catalog = str(os.path.join(self.temp_dir, "c.nmcatalog"))

  def testSavesAndLoadsImagesSet(self):
    with self._FirstWindow():
      pass

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilPresent(selectors.StatusBarWithText(self.catalog))
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

  def testSavesAndLoadsImageTransformations(self):
    with self._FirstWindow() as b:
      b.Click(selectors.ImageBoxWithTitle("1.png"))
      b.app.TriggerAction("RotateCW")
      b.WaitUntilPresent(selectors.SelectedImageBox(rotation=90))

      b.Click(selectors.ImageBoxWithTitle("2.png"))
      b.app.TriggerAction("RotateCCW")
      b.WaitUntilPresent(selectors.SelectedImageBox(rotation=270))

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    b_new.Click(selectors.ImageBoxWithTitle("0.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rotation=0))

    b_new.Click(selectors.ImageBoxWithTitle("1.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rotation=90))

    b_new.Click(selectors.ImageBoxWithTitle("2.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rotation=270))

  def testSavesAndLoadsLabels(self):
    with self._FirstWindow() as b:
      b.Click(selectors.ImageBoxWithTitle("0.png"))
      b.app.TriggerAction("LabelRed")
      b.WaitUntilPresent(selectors.SelectedImageBox(label="red"))

      b.Click(selectors.ImageBoxWithTitle("1.png"))
      b.app.TriggerAction("LabelGreen")
      b.WaitUntilPresent(selectors.SelectedImageBox(label="green"))

      b.Click(selectors.ImageBoxWithTitle("2.png"))
      b.app.TriggerAction("LabelBlue")
      b.WaitUntilPresent(selectors.SelectedImageBox(label="blue"))

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    b_new.Click(selectors.ImageBoxWithTitle("0.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(label="red"))

    b_new.Click(selectors.ImageBoxWithTitle("1.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(label="green"))

    b_new.Click(selectors.ImageBoxWithTitle("2.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(label="blue"))

  def testSavesAndLoadsRatings(self):
    with self._FirstWindow() as b:
      b.Click(selectors.ImageBoxWithTitle("0.png"))
      b.app.TriggerAction("Rating1")
      b.WaitUntilPresent(selectors.SelectedImageBox(rating=1))

      b.Click(selectors.ImageBoxWithTitle("1.png"))
      b.app.TriggerAction("Rating2")
      b.WaitUntilPresent(selectors.SelectedImageBox(rating=2))

      b.Click(selectors.ImageBoxWithTitle("2.png"))
      b.app.TriggerAction("Rating3")
      b.WaitUntilPresent(selectors.SelectedImageBox(rating=3))

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    b_new.Click(selectors.ImageBoxWithTitle("0.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rating=1))

    b_new.Click(selectors.ImageBoxWithTitle("1.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rating=2))

    b_new.Click(selectors.ImageBoxWithTitle("2.png"))
    b_new.WaitUntilPresent(selectors.SelectedImageBox(rating=3))

  def testSavesAndLoadsSelection(self):
    with self._FirstWindow() as b:
      b.Click(selectors.ImageBoxWithTitle("5.png"))

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())
    b_new.WaitUntilPresent(selectors.SelectedImageBox(title="5.png"))

  def testSavesAndLoadsLabelFilter(self):
    with self._FirstWindow() as b:
      b.Click(selectors.ImageBoxWithTitle("0.png"))
      b.app.TriggerAction("LabelRed")
      b.WaitUntilPresent(selectors.SelectedImageBox(label="red"))

      b.Click(selectors.LabelFilterRadioButton("red", items_count=1))

    b_new = self.CreateWindow(catalog_path=self.catalog)
    b_new.WaitUntilCountEqual(1, selectors.ImageBoxes())
    b_new.WaitUntilPresent(selectors.LabelFilterRadioButton("red", items_count=1, checked=True))

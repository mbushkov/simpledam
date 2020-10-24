import os
import shutil
import tempfile
from typing import cast

from PIL import Image, ImageDraw
from newmedia_e2e.lib.base import BrowserWindow
from selenium.webdriver.common.keys import Keys

from newmedia_e2e.lib import base


class ImageGridTest(base.TestBase):

  NUM_IMAGES = 10

  def _GetSortedImages(self, b: BrowserWindow):
    return sorted(
        b.GetDisplayedElements('.image-grid .image-box'),
        key=lambda i: (i.rect["y"], i.rect["x"]),
    )

  def setUp(self):
    self.temp_dir = tempfile.mkdtemp()
    self.addCleanup(shutil.rmtree, self.temp_dir)

    for i in range(self.NUM_IMAGES):
      img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
      d = cast(ImageDraw.ImageDraw, ImageDraw.Draw(img))
      d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))
      img.save(os.path.join(self.temp_dir, "%d.png" % i))

  def testClickingOnEachImageHighlightsIt(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid img")

    images = self._GetSortedImages(b)
    for image in images:
      b.Click(image)
      self.assertEqual(image, b.GetDisplayedElement('.image-grid .image-box.selected'))

  def testPressingArrowKeysChangesSelection(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid img")

    images = self._GetSortedImages(b)
    y_offsets = list(sorted(set(e.rect["y"] for e in images)))

    # Note using jquery:eq might not be the best idea, since by default it also matches invisible elements.
    b.Click(images[0])

    b.SendKeys(Keys.RIGHT)
    b.WaitUntilEqual(lambda: b.GetDisplayedElement('.image-grid .image-box.selected'),
                     lambda: b.GetDisplayedElements('.image-grid .image-box')[1])

    b.SendKeys(Keys.LEFT)
    b.WaitUntilEqual(lambda: b.GetDisplayedElement('.image-grid .image-box.selected'),
                     lambda: b.GetDisplayedElements('.image-grid .image-box')[0])

    b.SendKeys(Keys.DOWN)
    b.WaitUntilEqual(y_offsets[1],
                     lambda: b.GetDisplayedElement('.image-grid .image-box.selected').rect["y"])

    b.SendKeys(Keys.UP)
    b.WaitUntilEqual(y_offsets[0],
                     lambda: b.GetDisplayedElement('.image-grid .image-box.selected').rect["y"])

  def testResizinginSingleImageViewHandledCorrectlyByImageGrid(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")

    images = self._GetSortedImages(b)
    # There was a bug when resizing in a single image made the grid switch to a single column.
    # Checking that it doesn't happen.
    x_offsets = set(e.rect["x"] for e in images)
    self.assertGreater(len(x_offsets), 1)

    # Double click on an image and wait until the Media tab gets highlighted.
    b.DoubleClick(images[0])
    b.WaitUntilPresent(".mode-panel li.is-active:contains('Media')")

    # Resized the window and switch back to the thumbnails tab.
    b.electron.ResizeWindowBy(200, 200)
    b.Click(".mode-panel a:contains('Thumbnails')")

    # Wait until all images are displayed, make sure they're not in a single column.
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")

    # Check that there's more than one column.
    images = b.GetDisplayedElements('.image-grid .image-box')
    x_offsets = set(e.rect["x"] for e in images)
    self.assertGreater(len(x_offsets), 1)

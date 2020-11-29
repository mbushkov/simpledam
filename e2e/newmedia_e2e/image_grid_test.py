from newmedia_e2e.lib.base import BrowserWindow
from selenium.webdriver.common.keys import Keys

from newmedia_e2e.lib import base, images, selectors


class ImageGridTest(base.TestBase):

  NUM_IMAGES = 10

  def _GetSortedImages(self, b: BrowserWindow):
    return sorted(
        b.GetDisplayedElements(selectors.ImageBoxes()),
        key=lambda i: (i.rect["y"], i.rect["x"]),
    )

  def setUp(self):
    self.temp_dir = images.CreateTempImages(self, count=self.NUM_IMAGES)

  def testClickingOnEachImageHighlightsIt(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    images = self._GetSortedImages(b)
    for image in images:
      b.Click(image)
      b.WaitUntilEqual(image, lambda: b.GetDisplayedElement(selectors.SelectedImageBox()))

  def testPressingArrowKeysChangesSelection(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    images = self._GetSortedImages(b)
    y_offsets = list(sorted(set(e.rect["y"] for e in images)))

    # Note using jquery:eq might not be the best idea, since by default it also matches invisible elements.
    b.Click(images[0])

    b.SendKeys(Keys.RIGHT)
    b.WaitUntilEqual(lambda: b.GetDisplayedElement(selectors.SelectedImageBox()),
                     lambda: b.GetDisplayedElements(selectors.ImageBoxes())[1])

    b.SendKeys(Keys.LEFT)
    b.WaitUntilEqual(lambda: b.GetDisplayedElement(selectors.SelectedImageBox()),
                     lambda: b.GetDisplayedElements(selectors.ImageBoxes())[0])

    b.SendKeys(Keys.DOWN)
    b.WaitUntilEqual(y_offsets[1],
                     lambda: b.GetDisplayedElement(selectors.SelectedImageBox()).rect["y"])

    b.SendKeys(Keys.UP)
    b.WaitUntilEqual(y_offsets[0],
                     lambda: b.GetDisplayedElement(selectors.SelectedImageBox()).rect["y"])

  def testResizinginSingleImageViewHandledCorrectlyByImageGrid(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    images = self._GetSortedImages(b)
    # There was a bug when resizing in a single image made the grid switch to a single column.
    # Checking that it doesn't happen.
    x_offsets = set(e.rect["x"] for e in images)
    self.assertGreater(len(x_offsets), 1)

    # Double click on an image and wait until the Media tab gets highlighted.
    b.DoubleClick(images[0])
    b.WaitUntilPresent(selectors.ModePanel("Media", is_active=True))

    # Resized the window and switch back to the thumbnails tab.
    b.electron.ResizeWindowBy(200, 200)
    b.Click(selectors.ModePanel("Thumbnails"))

    # Wait until all images are displayed, make sure they're not in a single column.
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    # Check that there's more than one column.
    images = b.GetDisplayedElements(selectors.ImageBoxes())
    x_offsets = set(e.rect["x"] for e in images)
    self.assertGreater(len(x_offsets), 1)

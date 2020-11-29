import os

from newmedia_e2e.lib import base, images, selectors


class FilteringTest(base.TestBase):

  NUM_IMAGES = 10

  def setUp(self):
    self.temp_dir = images.CreateTempImagesInFolders(self, count=self.NUM_IMAGES)

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

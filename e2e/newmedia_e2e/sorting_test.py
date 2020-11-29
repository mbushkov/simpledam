import os

from selenium.webdriver.common.keys import Keys

from newmedia_e2e.lib import base, images, selectors


class SortingTest(base.TestBase):

  NUM_IMAGES = 10

  def testSortsByPathWhenImportingFolder(self):
    temp_dir = images.CreateTempImages(self, count=self.NUM_IMAGES)

    b = self.CreateWindow(temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    b.Click(selectors.ImageBoxWithIndex(0))
    for i in range(self.NUM_IMAGES):
      b.WaitUntilPresent(selectors.SelectedImageBox(title=f"{i}.png"))
      b.SendKeys(Keys.RIGHT)

  def testSortsBatchImportByRootFoldersPaths(self):
    batch_count = 5
    temp_dirs = [images.CreateTempImages(self, count=self.NUM_IMAGES) for _ in range(batch_count)]

    b = self.CreateWindow()
    b.app.TriggerAction("ScanPaths", temp_dirs)

    b.Click(selectors.ImageBoxWithIndex(0))
    for td in sorted(temp_dirs):
      for j in range(self.NUM_IMAGES):
        b.WaitUntilPresent(selectors.SelectedImageBox(title=f"{j}.png"))
        b.WaitUntilPresent(selectors.ImageViewerFilename(contains=os.path.join(td, f"{j}.png")))
        b.SendKeys(Keys.RIGHT)

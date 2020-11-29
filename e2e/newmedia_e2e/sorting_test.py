from selenium.webdriver.common.keys import Keys

from newmedia_e2e.lib import base, images, selectors


class SortingTest(base.TestBase):

  NUM_IMAGES = 10

  def setUp(self):
    self.temp_dir = images.CreateTempImages(self)

  def testSortsByPathWhenImportingFolder(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, selectors.ImageBoxes())

    b.Click(selectors.ImageBoxWithIndex(0))
    for i in range(self.NUM_IMAGES):
      b.WaitUntilPresent(selectors.SelectedImageBox(title=f"{i}.png"))
      b.SendKeys(Keys.RIGHT)

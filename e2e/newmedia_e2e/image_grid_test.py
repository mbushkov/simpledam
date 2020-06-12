import os
import shutil
import tempfile

from PIL import Image, ImageDraw

from newmedia_e2e.lib import base


class ImageGridTest(base.TestBase):

  NUM_IMAGES = 10

  def setUp(self):
    self.temp_dir = tempfile.mkdtemp()
    self.addCleanup(shutil.rmtree, self.temp_dir)

    for i in range(self.NUM_IMAGES):
      img = Image.new("RGB", (500, 500), color=(20 * i, 20 * i, 20 * i))
      d = ImageDraw.Draw(img)
      d.text((10, 10), "Image %d" % i, fill=(255, 255, 0))
      img.save(os.path.join(self.temp_dir, "%d.png" % i))

  def testSomething(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilEquals(self.NUM_IMAGES, lambda: len(b.GetDisplayedElements('.image-grid img')))

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

  def testDisplaysAllImages(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid img")

  def testResizinginSingleImageViewHandledCorrectlyByImageGrid(self):
    b = self.CreateWindow(self.temp_dir)
    b.WaitUntilCountEqual(self.NUM_IMAGES, ".image-grid .image-box")

    images = b.GetDisplayedElements('.image-grid .image-box')
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



      
     
       
  
            
           
        
      
     
       
  
            
           
        
           
             
                 
                 
                                       

      
     
       
  
            
           
        
      
     
       
  
            
           
        
           
             
                 
                 
                                       

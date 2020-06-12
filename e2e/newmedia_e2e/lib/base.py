import os
import time
from typing import List, Optional
import unittest

from selenium import webdriver, common


class Error(Exception):
  pass


class ElementNotFoundError(Error):
  pass


class ConditionNotMetError(Error):
  pass


# https://www.electronjs.org/docs/api
class Electron:

  def __init__(self, webdriver: webdriver.Chrome):
    self.wd = webdriver

  def OpenDevTools(self):
    self.wd.execute_script("window.rawElectron.openDevTools()")


class BrowserWindow:

  def __init__(self, webdriver: webdriver.Chrome):
    self.wd = webdriver

  def Close(self):
    self.wd.close()
    self.wd.quit()

  @property
  def electron(self) -> Electron:
    return Electron(self.wd)

  def GetDisplayedElements(self, css) -> List[webdriver.remote.webelement.WebElement]:
    for _ in range(10):
      try:
        return [e for e in self.wd.find_elements_by_css_selector(css) if e.is_displayed()]
      except common.exceptions.NoSuchElementException:
        time.sleep(1)

    raise ElementNotFoundError(css)

  def WaitUntilEquals(self, value, fn, *args):
    for _ in range(10):
      cv = fn(*args)
      if cv == value:
        return

      time.sleep(1)

    raise ConditionNotMetError("Result didn't match expected value: " + repr(value))


class TestBase(unittest.TestCase):

  webdriver_service: webdriver.chrome.service.Service = None

  @classmethod
  def setUpClass(cls):
    os.environ["IS_NM_E2E_TEST"] = "1"

    cls.webdriver_service = webdriver.chrome.service.Service("chromedriver")
    cls.webdriver_service.start()

  @classmethod
  def tearDownClass(cls):
    cls.webdriver_service.stop()

  def CreateWindow(self, scan_path: Optional[str] = None) -> BrowserWindow:
    print("Using remote URL: ", self.__class__.webdriver_service.service_url)

    wd = webdriver.remote.webdriver.WebDriver(
        command_executor=self.__class__.webdriver_service.service_url,
        desired_capabilities={
            "browserName": "chrome",
            "goog:chromeOptions": {
                "args": ["--scan-path=%s" % scan_path],
                "binary":
                    os.path.join(os.path.dirname(__file__), "..", "..", "..",
                                 "app/dist_electron/mac/SimpleDAM.app/Contents/MacOS/SimpleDAM"),
                "extensions": [],
                "windowTypes": ["webview"]
            },
            "platform": "ANY",
            "version": ""
        },
        browser_profile=None,
        proxy=None,
        keep_alive=False)
    win = BrowserWindow(wd)

    self.addCleanup(win.Close)

    return win

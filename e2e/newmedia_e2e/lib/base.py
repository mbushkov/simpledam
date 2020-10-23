import os
import pkg_resources
import time
import unittest
from typing import Any, Callable, List, Optional, TypeVar, Union

from selenium import common, webdriver


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

  def ResizeWindowBy(self, width: int, height: int):
    self.wd.execute_script(f"window.rawElectron.resizeWindowBy({width}, {height})")

T = TypeVar('T')
WebElement = Union[webdriver.remote.webelement.WebElement]

class BrowserWindow:

  def __init__(self, webdriver: webdriver.Chrome):
    self.wd = webdriver

  def Close(self):
    self.wd.close()
    self.wd.quit()

  @property
  def electron(self) -> Electron:
    return Electron(self.wd)

  def _FindElements(self, query: str) -> List[WebElement]:
    elems = self.wd.execute_script("return $(\"" + query.replace("\"", "\\\"") + "\");")
    return [e for e in elems if e.is_displayed()]

  def _FindElement(self, query: str) -> WebElement:
    elems = self._FindElements(query)
    if not elems:
      raise ElementNotFoundError(query)
    return elems[0]

  def WaitUntil(self, fn:Callable[..., T], *args:Any) -> T:
    max_num = 10
    for i in range(max_num):
      try:
        result = fn(*args)
        if result:
          return result
        time.sleep(1)
      except Exception as e:
        if i < max_num - 1:
          time.sleep(1)
        else:
          raise ConditionNotMetError(f"Last ({i}th) attempt failed with exception: {e}") from e

    raise ConditionNotMetError(f"None of {max_num} attempts returned a truthy value")

  def WaitUntilEqual(self, expected: T, fn: Callable[..., T], *args: Any) -> None:
    self.WaitUntil(lambda: fn(*args) == expected)

  def WaitUntilCountEqual(self, expected: int, query: str) -> None:
    self.WaitUntilEqual(expected, lambda: len(self._FindElements(query)))

  def WaitUntilPresent(self, query: str) -> None:
    self.WaitUntil(lambda: self._FindElements(query))

  def GetDisplayedElements(self, query: str) -> List[WebElement]:
    return self.WaitUntil(self._FindElements, query)

  def GetDisplayedElement(self, query: str) -> WebElement:
    return self.WaitUntil(self._FindElement, query)

  def Click(self, query_or_elem: Union[str, WebElement]) -> None:
    if isinstance(query_or_elem, webdriver.remote.webelement.WebElement):
      query_or_elem.click()
    else:      
      self._FindElement(query_or_elem).click()

  def DoubleClick(self, query_or_elem: Union[str, WebElement]) -> None:
    if isinstance(query_or_elem, webdriver.remote.webelement.WebElement):
      elem = query_or_elem
    else:
      elem = self._FindElement(query_or_elem)
    
    action = webdriver.ActionChains(self.wd)
    action.double_click(elem).perform()


class TestBase(unittest.TestCase):

  webdriver_service: webdriver.chrome.service.Service = None
  jquery_source: str = ""

  @classmethod
  def setUpClass(cls):
    os.environ["IS_NM_E2E_TEST"] = "1"

    cls.webdriver_service = webdriver.chrome.service.Service("chromedriver")
    cls.webdriver_service.start()

    requirement = pkg_resources.Requirement.parse("newmedia_e2e")
    with pkg_resources.resource_stream(requirement, "newmedia_e2e/assets/jquery-3.5.1.min.js") as fd:
      cls.jquery_source = fd.read().decode("utf-8")

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

    jquery_present = wd.execute_script("return window.$ !== undefined;")
    if not jquery_present:
      wd.execute_script(self.__class__.jquery_source)

    self.addCleanup(win.Close)

    return win

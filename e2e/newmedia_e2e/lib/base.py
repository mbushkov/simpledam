import os
import pdb
import pkg_resources
import time
import unittest
from typing import Any, Callable, List, Optional, TypeVar, Union

from selenium import webdriver
from selenium.webdriver import remote
from selenium.common import exceptions as selenium_exceptions
from selenium.webdriver.chrome import service as chrome_service
from selenium.webdriver.remote import webelement


class Error(Exception):
  pass


class ElementNotFoundError(Error):
  pass


class MoreThanOneElementFoundError(Error):
  pass


class ExpressionNotEqualError(Error):
  pass


class ConditionNotMetError(Error):
  pass


# https://www.electronjs.org/docs/api
class Electron:

  def __init__(self, webdriver: webdriver.Remote):
    self.wd = webdriver

  def OpenDevTools(self):
    self.wd.execute_script("window.rawElectron.openDevTools()")

  def ResizeWindowBy(self, width: int, height: int):
    self.wd.execute_script(f"window.rawElectron.resizeWindowBy({width}, {height})")


class App:

  def __init__(self, webdriver: webdriver.Remote):
    self.wd = webdriver

  def TriggerAction(self, action_name: str, *args: Any):
    self.wd.execute_script(
        """
      window.dispatchEvent(new CustomEvent('nm-action', {
          detail: {
            actionName: '%s',
            args: arguments
          }
        }))
      """ % action_name, *args)


T = TypeVar('T')


class BrowserWindow:

  def __init__(self, webdriver: webdriver.Remote):
    self.wd = webdriver

  def Close(self):
    self.wd.close()
    self.wd.quit()

  def Breakpoint(self):
    self.electron.OpenDevTools()
    pdb.set_trace()

  @property
  def electron(self) -> Electron:
    return Electron(self.wd)

  @property
  def app(self) -> App:
    return App(self.wd)

  def _FindElements(self, query: str) -> List[webelement.WebElement]:
    elems = self.wd.execute_script("return $(\"" + query.replace("\"", "\\\"") + "\");")
    return [e for e in elems if e.is_displayed()]

  def _FindElement(self, query: str) -> webelement.WebElement:
    elems = self._FindElements(query)
    if not elems:
      raise ElementNotFoundError(query)
    if len(elems) > 1:
      raise MoreThanOneElementFoundError(query)
    return elems[0]

  def WaitUntil(self, fn: Callable[..., T], *args: Any) -> T:
    max_num = 10
    for i in range(max_num):
      try:
        result = fn(*args)
        if result:
          return result
        time.sleep(1)
      except (Error, selenium_exceptions.WebDriverException) as e:
        if i < max_num - 1:
          time.sleep(1)
        else:
          raise ConditionNotMetError(f"Last ({i}th) attempt failed with exception: {e}") from e

    raise ConditionNotMetError(f"None of {max_num} attempts returned a truthy value")

  def WaitUntilEqual(
      self,
      expected: Union[T, Callable[[], T]],
      fn: Callable[..., T],
      *args: Any,
  ) -> None:

    def Check():
      result = fn(*args)
      if callable(expected):
        expected_value = expected()  # type: ignore
      else:
        expected_value = expected
      if result != expected_value:
        raise ExpressionNotEqualError(f"got: {result}, expected: {expected_value}")

      return True

    self.WaitUntil(Check)

  def WaitUntilCountEqual(self, expected: int, query: str) -> None:
    self.WaitUntilEqual(expected, lambda: len(self._FindElements(query)))

  def WaitUntilPresent(self, query: str) -> None:
    self.WaitUntil(lambda: self._FindElements(query))

  def GetDisplayedElements(self, query: str) -> List[webelement.WebElement]:
    return self.WaitUntil(self._FindElements, query)

  def GetDisplayedElement(self, query: str) -> webelement.WebElement:
    return self.WaitUntil(self._FindElement, query)

  def Click(self, query_or_elem: Union[str, webelement.WebElement]) -> None:
    if isinstance(query_or_elem, webelement.WebElement):
      query_or_elem.click()
    else:
      self.GetDisplayedElement(query_or_elem).click()

  def DoubleClick(self, query_or_elem: Union[str, webelement.WebElement]) -> None:
    if isinstance(query_or_elem, webelement.WebElement):
      elem = query_or_elem
    else:
      elem = self.GetDisplayedElement(query_or_elem)

    action = webdriver.ActionChains(self.wd)
    action.double_click(elem).perform()

  def SendKeys(self, keys: str):
    body = self.GetDisplayedElement('body')
    body.send_keys(keys)


class TestBase(unittest.TestCase):

  webdriver_service: chrome_service.Service
  jquery_source: str = ""

  @classmethod
  def setUpClass(cls):
    os.environ["IS_NM_E2E_TEST"] = "1"

    cls.webdriver_service = chrome_service.Service("chromedriver")
    cls.webdriver_service.start()

    requirement = pkg_resources.Requirement.parse("newmedia_e2e")
    with pkg_resources.resource_stream(requirement,
                                       "newmedia_e2e/assets/jquery-3.5.1.min.js") as fd:
      cls.jquery_source = fd.read().decode("utf-8")

  @classmethod
  def tearDownClass(cls):
    cls.webdriver_service.stop()

  @property
  def _chromedriver(self):
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..",
                     "app/dist-electron/mac-arm64/simpledam.app/Contents/MacOS/simpledam"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..",
                     "app/dist-electron/mac/simpledam.app/Contents/MacOS/simpledam")
    ]
    for p in paths:
      if os.path.exists(p):
        return p

    raise RuntimeError("chromedriver binary couldn't be found at following locations: " + ", ".join(paths))

  def CreateWindow(self,
                   scan_path: Optional[str] = None,
                   catalog_path: Optional[str] = None) -> BrowserWindow:
    print("Using remote URL: ", self.__class__.webdriver_service.service_url)

    args = []

    if scan_path is not None:
      args.append("--scan=%s" % scan_path)

    if catalog_path is not None:
      args.append("--catalog=%s" % catalog_path)

    print("Launching with args: ", args)
    wd = webdriver.Remote(
        command_executor=self.__class__.webdriver_service.service_url,
        desired_capabilities={
            "browserName": "chrome",
            "goog:chromeOptions": {
                "args":
                    args,
                # Detect binary based on the platform.
                "binary": self._chromedriver,
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

    def WindowCleanup():
      try:
        win.Close()
      except selenium_exceptions.InvalidSessionIdException:
        pass

    self.addCleanup(WindowCleanup)

    return win

import os
import pdb
import pkg_resources
import subprocess
import tempfile
import time
import unittest
from typing import Any, Callable, List, Optional, TypeVar, Union

from retry import retry
from selenium import webdriver
from selenium.webdriver.chromium.options import ChromiumOptions
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

  @retry(selenium_exceptions.ElementNotInteractableException, tries=10, delay=1)
  def Click(self, query_or_elem: Union[str, webelement.WebElement]) -> None:
    if isinstance(query_or_elem, webelement.WebElement):
      query_or_elem.click()
    else:
      self.GetDisplayedElement(query_or_elem).click()

  @retry(selenium_exceptions.ElementNotInteractableException, tries=10, delay=1)
  def DoubleClick(self, query_or_elem: Union[str, webelement.WebElement]) -> None:
    if isinstance(query_or_elem, webelement.WebElement):
      elem = query_or_elem
    else:
      elem = self.GetDisplayedElement(query_or_elem)

    action = webdriver.ActionChains(self.wd)
    action.double_click(elem).perform()

  @retry(selenium_exceptions.ElementNotInteractableException, tries=10, delay=1)
  def SendKeys(self, keys: str):
    body = self.GetDisplayedElement('body')
    body.send_keys(keys)

  def Screenshot(self, path:str) -> None:
    self.wd.save_screenshot(path)


class TestBase(unittest.TestCase):

  webdriver_service: chrome_service.Service
  jquery_source: str = ""

  def __init__(self, methodName: str = "runTest") -> None:
    super().__init__(methodName)
    self.last_screenshot_bytes: Optional[bytes] = None

  @classmethod
  def setUpClass(cls):
    os.environ["INSIDE_E2E_TEST"] = "1"
    cls.webdriver_service = chrome_service.Service("chromedriver", service_args=[], log_output=subprocess.STDOUT)
    cls.webdriver_service.start()

    requirement = pkg_resources.Requirement.parse("newmedia_e2e")
    with pkg_resources.resource_stream(requirement,
                                       "newmedia_e2e/assets/jquery-3.5.1.min.js") as fd:
      cls.jquery_source = fd.read().decode("utf-8")

  @classmethod
  def tearDownClass(cls):
    cls.webdriver_service.stop()

  @property
  def _browser(self):
    paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..",
                     "app/dist-electron/mac-arm64/simpledam.app/Contents/MacOS/simpledam"),
        os.path.join(os.path.dirname(__file__), "..", "..", "..",
                     "app/dist-electron/mac/simpledam.app/Contents/MacOS/simpledam")
    ]
    for p in paths:
      if os.path.exists(p):
        return p

    raise RuntimeError("browser binary couldn't be found at following locations: " + ", ".join(paths))

  def CreateWindow(self,
                   scan_path: Optional[str] = None,
                   catalog_path: Optional[str] = None) -> BrowserWindow:
    print("Using remote URL: ", self.__class__.webdriver_service.service_url)

    args = []

    class ElectronOptions(ChromiumOptions):
      def to_capabilities(self) -> dict:
        result = super().to_capabilities()
        result["browserName"] = "chrome"
        result[self.KEY]["windowTypes"] = ["webview"]
        return result

    options = ElectronOptions()
    options.binary_location = self._browser

    if scan_path is not None:
      options.add_argument("--scan=%s" % scan_path)

    if catalog_path is not None:
      options.add_argument("--catalog=%s" % catalog_path)

    wd = webdriver.Remote(
        command_executor=self.__class__.webdriver_service.service_url,
        options=options,
        keep_alive=False,
      )
    win = BrowserWindow(wd)

    jquery_present = wd.execute_script("return window.$ !== undefined;")
    if not jquery_present:
      wd.execute_script(self.__class__.jquery_source)

    def WindowCleanup():
      try:
        with tempfile.NamedTemporaryFile(suffix=".png") as fd:
          wd.save_screenshot(fd.name)
          fd.seek(0)
          self.last_screenshot_bytes = fd.read()
      except selenium_exceptions.WebDriverException:
        pass
      
      try:
        win.Close()
      except selenium_exceptions.InvalidSessionIdException:
        pass

    self.addCleanup(WindowCleanup)

    return win

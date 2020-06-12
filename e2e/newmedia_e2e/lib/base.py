import os
import unittest

from selenium import webdriver


class TestBase(unittest.TestCase):

  webdriver_service = None
  webdriver = None

  @classmethod
  def setUpClass(cls):
    cls.webdriver_service = webdriver.chrome.service.Service("chromedriver")
    cls.webdriver_service.start()

    cls.webdriver = webdriver.remote.webdriver.WebDriver(
        command_executor=cls.webdriver_service.service_url,
        desired_capabilities={
            'browserName': 'chrome',
            'goog:chromeOptions': {
                'args': [],
                'binary':
                    os.path.join(os.path.dirname(__file__), "..", "..", "..",
                                 "app/dist_electron/mac/SimpleDAM.app/Contents/MacOS/SimpleDAM"),
                'extensions': [],
                'windowTypes': ['webview']
            },
            'platform': 'ANY',
            'version': ''
        },
        browser_profile=None,
        proxy=None,
        keep_alive=False)

  @classmethod
  def tearDownClass(cls):
    cls.webdriver.close()
    cls.webdriver_service.stop()

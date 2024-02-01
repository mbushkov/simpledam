from datetime import datetime
import os

import pytest

@pytest.hookimpl(wrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
  rep = yield

  if not os.environ["E2E_SCREENSHOT_PATH"]:
    return rep

  if rep.when == "call" and rep.failed and getattr(item.obj.__self__, "last_screenshot_bytes"):
    screenshot_path = os.path.join(
      os.environ["E2E_SCREENSHOT_PATH"], 
      f'screenshot_{datetime.today().strftime("%Y-%m-%d_%H:%M")}.png',
    )
    with open(screenshot_path, 'wb') as fd:
      fd.write(item.obj.__self__.last_screenshot_bytes)
    print(f"Saved screenshot at: {screenshot_path}")

  return rep

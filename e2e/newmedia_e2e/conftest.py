from datetime import datetime
import os

import pytest


_SCREENSHOT_COUNTER = 0


@pytest.hookimpl(wrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
  rep = yield

  if not os.environ.get("E2E_SCREENSHOTS_PATH"):
    return rep

  if rep.when == "call" and rep.failed and getattr(item.obj.__self__, "last_screenshot_bytes"):
    global _SCREENSHOT_COUNTER
    
    date_str = datetime.today().strftime("%Y-%m-%d_%H:%M").replace(":", "_")
    screenshot_path = os.path.join(
        os.environ["E2E_SCREENSHOTS_PATH"],
        f"screenshot_{date_str}_{_SCREENSHOT_COUNTER}.png",
    )
    _SCREENSHOT_COUNTER += 1

    with open(screenshot_path, 'wb') as fd:
      fd.write(item.obj.__self__.last_screenshot_bytes)
    print(f"Saved screenshot at: {screenshot_path}")

  return rep

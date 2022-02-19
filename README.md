Note: all instructions below are for MacOS 11 or later.

# Setting up dev environment

1. Check out the sources:
   ```bash
   git clone https://github.com/mbushkov/simpledam.git
   cd simpledam
   ```

1. Create a virtualenv with Python 3.9 or higher:
   ```bash
   python3 -m venv .venv3
   source .venv3/bin/activate
   pip install --upgrade pip setuptools wheel
   ```

1. Install nodeenv - this will tie the Python virtualenv environment with NodeJS.
   ```bash
   pip install nodeenv
   nodeenv -p --prebuilt --node=lts
   # Reinitialize virtualenv to get changes applied by the nodeenv.
   source .venv3/bin/activate
   ```
1. Install the Python backend and e2e tests code in edit mode:
   ```bash
   pip install -e ./backend/
   pip install -e ./e2e/
   ```
1. Install all NPM dependencies.
   ```bash
   cd app
   npm install
   cd ..
   ```

# Development workflow

1. Activate the virtualenv.
   ```bash
   cd simpledam
   source .venv3/bin/activate
   ```

1. Run Electron in watch-and-update mode:
   ```bash
   cd app
   npm run electron:serve
   ```

1. Now all the changes done to the TS code will be dynamically propagated to the running Electron process. In order to apply changes done in Python code, an app window has to be closed and opened again (there's one Python process behind each app window).

   Reference: [startBackendProcess()](https://github.com/mbushkov/simpledam/blob/a2c6f60523858024781456322049e616b8ee390b/app/src/background.ts#L45) function in the code that's responsible for creating a window-backing Python process.

   Note: each opened window automatically opens dev tools. If you don't need this behavior, comment out [this](https://github.com/mbushkov/simpledam/blob/a2c6f60523858024781456322049e616b8ee390b/app/src/background.ts#L124) line.

# Runnind E2E tests

1. Make sure chromedriver is installed. If not, [download](https://chromedriver.chromium.org/downloads) it from here and place the chromedriver binary into `/usr/local/bin`.

1. Build and package the app.
   ```bash
   cd app
   npm run electron:package
   cd ..
   ```

2. Run the tests:
   ```bash
   pytest ./e2e/newmedia_e2e
   ```
# Licensing

This software is distributed under the Apache License 2.0 (see the LICENSE file). It includes bits of pieces of the following MIT licensed software packages:

* Buefy (https://github.com/buefy/buefy)
  ```
  MIT License

  Copyright (c) 2017-2019 Rafael Beraldo

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  ```
* Splitpanes (https://github.com/antoniandre/splitpanes)
  ```
  MIT License

  Copyright (c) 2018 Antoni Andre

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  ```


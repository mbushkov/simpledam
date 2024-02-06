![CI status](https://github.com/mbushkov/simpledam/actions/workflows/build-mac.yaml/badge.svg?branch=master)


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

This software is distributed under the Apache License 2.0 (see the LICENSE file). It includes bits of pieces of the following software packages:

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

* Bulma (https://github.com/jgthms/bulma)

  ```
  The MIT License (MIT)
  
  Copyright (c) 2023 Jeremy Thomas
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  ```

* Vue.js (https://vuejs.org/)

  ```  
  The MIT License (MIT)  

  Copyright (c) 2018-present, Yuxi (Evan) You and Vue contributors  

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:  

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.  

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.```

* Python (https://www.python.org/)

  ```
  1. This LICENSE AGREEMENT is between the Python Software Foundation ("PSF"), and
    the Individual or Organization ("Licensee") accessing and otherwise using Python
    3.12.1 software in source or binary form and its associated documentation.

  2. Subject to the terms and conditions of this License Agreement, PSF hereby
    grants Licensee a nonexclusive, royalty-free, world-wide license to reproduce,
    analyze, test, perform and/or display publicly, prepare derivative works,
    distribute, and otherwise use Python 3.12.1 alone or in any derivative
    version, provided, however, that PSF's License Agreement and PSF's notice of
    copyright, i.e., "Copyright © 2001-2023 Python Software Foundation; All Rights
    Reserved" are retained in Python 3.12.1 alone or in any derivative version
    prepared by Licensee.

  3. In the event Licensee prepares a derivative work that is based on or
    incorporates Python 3.12.1 or any part thereof, and wants to make the
    derivative work available to others as provided herein, then Licensee hereby
    agrees to include in any such work a brief summary of the changes made to Python
    3.12.1.

  4. PSF is making Python 3.12.1 available to Licensee on an "AS IS" basis.
    PSF MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.  BY WAY OF
    EXAMPLE, BUT NOT LIMITATION, PSF MAKES NO AND DISCLAIMS ANY REPRESENTATION OR
    WARRANTY OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE
    USE OF PYTHON 3.12.1 WILL NOT INFRINGE ANY THIRD PARTY RIGHTS.

  5. PSF SHALL NOT BE LIABLE TO LICENSEE OR ANY OTHER USERS OF PYTHON 3.12.1
    FOR ANY INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES OR LOSS AS A RESULT OF
    MODIFYING, DISTRIBUTING, OR OTHERWISE USING PYTHON 3.12.1, OR ANY DERIVATIVE
    THEREOF, EVEN IF ADVISED OF THE POSSIBILITY THEREOF.

  6. This License Agreement will automatically terminate upon a material breach of
    its terms and conditions.

  7. Nothing in this License Agreement shall be deemed to create any relationship
    of agency, partnership, or joint venture between PSF and Licensee.  This License
    Agreement does not grant permission to use PSF trademarks or trade name in a
    trademark sense to endorse or promote products or services of Licensee, or any
    third party.

  8. By copying, installing or otherwise using Python 3.12.1, Licensee agrees
    to be bound by the terms and conditions of this License Agreement.
    ```
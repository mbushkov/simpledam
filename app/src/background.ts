'use strict'

import path from 'path';
import { app, protocol, ipcMain, nativeImage, BrowserWindow } from 'electron'
import {
  createProtocol, installVueDevtools,
  /* installVueDevtools */
} from 'vue-cli-plugin-electron-builder/lib'
import axios, { AxiosResponse } from 'axios';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

async function startBackendProcess(): Promise<{ backend: ChildProcessWithoutNullStreams, port: number }> {
  return new Promise<{ backend: ChildProcessWithoutNullStreams, port: number }>((resolve, reject) => {
    let binaryPath: string;
    if (isDevelopment) {
      binaryPath = 'newmedia_backend';
    } else {
      binaryPath = path.join(path.dirname(app.getAppPath()), '..', 'Resources', 'bin', 'backend', 'backend');
    }
    const backend = spawn(binaryPath, []);
    backend.stdin.pipe(process.stdout);

    let portLine: string | undefined = undefined;
    backend.stdout.on('data', (data: any) => {
      console.log(`[BACKEND] stdout: ${data}`);

      if (!portLine) {
        portLine = (data.toString() as string).split('\n')[0];
        resolve({ backend, port: Number(portLine) });
      }
    });

    backend.stderr.on('data', (data) => {
      console.log(`[BACKEND] stderr: ${data}`);
    });

    backend.on('close', (code) => {
      console.log(`[BACKEND] Exited with ${code}`);
      reject();
    });
  });
}

async function createWindow() {
  console.log('[BACKEND] Starting process...');
  const { backend, port } = await startBackendProcess();
  console.log(`[BACKEND] Process started (pid=${backend.pid}, port=${port})`);

  // Create the browser window.
  win = new BrowserWindow({
    title: 'New Media (pre-alpha)',
    width: 1024,
    height: 768,
    webPreferences: {
      // TODO: try turning this off.
      nodeIntegration: true
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '?port=' + port.toString())
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html?port=' + port.toString())
  }

  win.on('closed', () => {
    win = null
    backend.kill()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    await createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  }
  await createWindow()
})

ipcMain.on('ondragstart', (event, filePath, url) => {
  axios.get(url, { responseType: "arraybuffer" }).then((r: AxiosResponse) => {
    event.sender.startDrag({
      file: filePath,
      icon: nativeImage.createFromBuffer(r.data),
    });
  })
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

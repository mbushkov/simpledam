'use strict'

// App's icon is taken from here:
// https://www.metmuseum.org/art/collection/search/13325
// Portrait of a Gentleman, attributed to Henry Williams

import path from 'path';
import { app, protocol, ipcMain, nativeImage, BrowserWindow, Menu, dialog } from 'electron'
import {
  createProtocol, installVueDevtools,
  /* installVueDevtools */
} from 'vue-cli-plugin-electron-builder/lib'
import axios, { AxiosResponse } from 'axios';
import { ChildProcess, spawn } from 'child_process';

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: BrowserWindow[] = [];

const beforeReadyPaths: string[] = [];

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

async function startBackendProcess(catalogPath?: string): Promise<{ backend: ChildProcess, port: number }> {
  return new Promise<{ backend: ChildProcess, port: number }>((resolve, reject) => {
    let binaryPath: string;
    if (isDevelopment) {
      binaryPath = 'newmedia_backend';
    } else {
      binaryPath = path.join(path.dirname(app.getAppPath()), '..', 'Resources', 'bin', 'backend', 'backend');
    }
    console.log(`[BACKEND] Starting binary: ${binaryPath}`);
    const backend = spawn(binaryPath, catalogPath ? ["--db-file", catalogPath] : []);

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

// Globally defined path for static files.
declare let __static: string;

async function createWindow(catalogPath?: string) {
  console.log('[BACKEND] Starting process...');
  const { backend, port } = await startBackendProcess(catalogPath);
  console.log(`[BACKEND] Process started (pid=${backend.pid}, port=${port}, path=${catalogPath})`);

  // Create the browser window.
  const win = new BrowserWindow({
    title: 'SimpleDAM (pre-alpha)' + (catalogPath ? ` - ${catalogPath}` : ''),
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#282828',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__static, '/preload.js'),
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '?port=' + port.toString())
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html?port=' + port.toString())
  }

  win.on('closed', () => {
    console.log('[BACKEND]: Killing on windows close.')
    backend.kill('SIGKILL');
    windows.splice(windows.indexOf(win), 1);
  })

  windows.push(win);
}

app.on('open-file', async (event: Event, path: string) => {
  if (!path.endsWith('.nmcatalog')) {
    return;
  }

  event.preventDefault();
  if (app.isReady()) {
    await createWindow(path);
  } else {
    beforeReadyPaths.push(path);
  }
});

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
  if (windows.length === 0) {
    await createWindow()
  }
})

// TODO: add support for https://www.electronjs.org/docs/api/power-save-blocker
// The app shouldn't be suspended at least on import.

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

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Electron',
      submenu: [
        {
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Catalog',
          accelerator: 'CommandOrControl+N',
          async click() {
            await createWindow()
          }
        },
        {
          label: 'Open Catalog...',
          accelerator: 'CommandOrControl+O',
          async click() {
            const paths = dialog.showOpenDialogSync({
              title: 'Open Catalog',
              filters: [
                { name: 'SimpleDAM Catalogs', extensions: ['nmcatalog'] },
              ],
              properties: ['openFile'],
            });
            if (paths !== undefined && paths.length > 0) {
              await createWindow(paths[0]);
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Close',
          accelerator: 'CommandOrControl+W',
          click: function () {
            BrowserWindow.getFocusedWindow()?.close();
          }
        },
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: function () {
            const win = BrowserWindow.getFocusedWindow();
            win?.webContents.send('save');
          }
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          role: 'cut'
        },
        {
          role: 'copy'
        },
        {
          role: 'paste'
        },
        {
          role: 'delete'
        },
      ]
    },
    {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  if (beforeReadyPaths.length === 0) {
    await createWindow()
  } else {
    for (const p of beforeReadyPaths) {
      await createWindow(p);
    }
  }
})

ipcMain.on('ondragstart', (event, paths) => {
  // console.log('here', paths);
  setTimeout(() => {
    // Type definiition doesn't account for 'files' property.
    const params: any = {
      'files': paths,
      // Just use any icon - the one set in the web event handler should prevail.
      'icon': nativeImage.createFromNamedImage('NSActionTemplate', [0, 0, 0]),
    };
    event.sender.startDrag(params);

    event.reply('ondragstart-confirmed', true);
  }, 100); // Hell knows why this is needed.
});

ipcMain.on('show-save-catalog-dialog', async (event) => {
  const bw = BrowserWindow.getFocusedWindow();
  if (!bw) {
    return;
  }

  const path = (await dialog.showSaveDialog(bw, {
    title: 'Save Catalog',
    defaultPath: 'Catalog.nmcatalog',
  })).filePath;
  event.reply('show-save-catalog-dialog-reply', path || '');
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    });
  } else {
    process.on('SIGTERM', () => {
      console.log('Got SIGTERM');
      app.quit()
    });
  }
}

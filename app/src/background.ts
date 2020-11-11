'use strict'

// App's icon is taken from here:
// https://www.metmuseum.org/art/collection/search/13325
// Portrait of a Gentleman, attributed to Henry Williams

import { ChildProcess, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain, IpcMainEvent, Menu, nativeImage, protocol, session, shell } from 'electron';
import path from 'path';
import {
  createProtocol, installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib';

console.log('Raw arguments: ', process.argv);

function extractStringArg(name: string): string | undefined {
  for (const s of process.argv) {
    const prefix = `--${name}=`;
    if (s.startsWith(prefix)) {
      return s.substring(prefix.length);
    }
  }

  return undefined;
}

const ARGV = {
  scanPath: extractStringArg('scan'),
  catalogPath: extractStringArg('catalog'),
};

app.commandLine.appendSwitch('host-rules', 'MAP * 127.0.0.1');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: BrowserWindow[] = [];

const beforeReadyPaths: string[] = [];

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

async function startBackendProcess(catalogPath?: string): Promise<{ backend: ChildProcess, port: number, secret: string }> {
  return new Promise<{ backend: ChildProcess, port: number, secret: string }>((resolve, reject) => {
    let binaryPath: string;
    if (isDevelopment || process.env.IS_TEST) {
      binaryPath = 'newmedia_backend';
    } else {
      binaryPath = path.join(path.dirname(app.getAppPath()), '..', 'Resources', 'bin', 'backend', 'backend');
    }
    const binaryArgs = [];
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      binaryArgs.push('--dev');
    }
    if (catalogPath) {
      binaryArgs.push('--db-file');
      binaryArgs.push(catalogPath);
    }

    console.log(`[BACKEND] Starting binary: ${binaryPath} ${binaryArgs.join(' ')}`);
    const backend = spawn(binaryPath, binaryArgs);

    let feedbackLine: string | undefined = undefined;
    backend.stdout.on('data', (data: any) => {
      console.log(`[BACKEND] stdout: ${data}`);

      if (!feedbackLine) {
        feedbackLine = (data.toString() as string).split('\n')[0];
        const feedback = JSON.parse(feedbackLine);
        resolve({ backend, port: Number(feedback['port']), secret: feedback['secret'] });
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

interface CreateWindowOptions {
  catalogPath?: string;
  scanPath?: string;
}

async function createWindow(options: CreateWindowOptions = {}) {
  console.log('[BACKEND] Starting process...');
  const { backend, port, secret } = await startBackendProcess(options.catalogPath);
  console.log(`[BACKEND] Process started (pid=${backend.pid}, port=${port}, secret=${secret}, path=${options.catalogPath})`);

  // Create the browser window.
  const win = new BrowserWindow({
    title: 'SimpleDAM (pre-alpha)' + (options.catalogPath ? ` - ${options.catalogPath}` : ''),
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#282828',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__static, '/preload.js'),
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    let url = process.env.WEBPACK_DEV_SERVER_URL + '?port=' + port.toString() + '&secret=' + secret;
    if (options.scanPath) {
      url += '&scan-path=' + encodeURIComponent(options.scanPath);
    }
    win.loadURL(url);
    if (!process.env.IS_TEST) {
      win.webContents.openDevTools();
    }
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    let url = 'app://./index.html?port=' + port.toString() + '&secret=' + secret;
    if (options.scanPath) {
      url += '&scan-path=' + encodeURIComponent(options.scanPath);
    }
    win.loadURL(url)
  }

  win.on('close', (e) => {
    e.preventDefault();
    win?.webContents.send('check-for-unsaved-changes');
  });

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
    await createWindow({ catalogPath: path });
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
  // TODO: audit the measures through https://www.electronjs.org/docs/tutorial/security
  // Make sure no additional permissions can be requested.
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    return callback(false);
  });

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
              await createWindow({ catalogPath: paths[0] });
            }
          }
        },
        {
          type: 'separator'
        },
        {
          id: 'Close',
          label: 'Close',
          accelerator: 'CommandOrControl+W',
          click: function () {
            BrowserWindow.getFocusedWindow()?.close();
          }
        },
        {
          id: 'Save',
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: function () {
            const win = BrowserWindow.getFocusedWindow();
            win?.webContents.send('action', 'Save');
          }
        },
        {
          id: 'SaveAs',
          label: 'Save As...',
          accelerator: 'CommandOrControl+Shift+S',
          click: function () {
            const win = BrowserWindow.getFocusedWindow();
            win?.webContents.send('action', 'SaveAs');
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
      label: 'Selection',
      submenu: [
        menuItem('ShowMediaFile', 'Show Media File'),
        menuItem('ExportToFolder', 'Export To Folder...'),
        { type: 'separator' },
        {
          label: 'Rating',
          submenu: [
            menuItem('Rating0', 'None'),
            { type: 'separator' },
            menuItem('Rating1', '★'),
            menuItem('Rating2', '★★'),
            menuItem('Rating3', '★★★'),
            menuItem('Rating4', '★★★★'),
            menuItem('Rating5', '★★★★★'),
          ],
        },
        {
          label: 'Label',
          submenu: [
            menuItem('LabelNone', 'None'),
            { type: 'separator' },
            menuItem('LabelRed', 'Red'),
            menuItem('LabelGreen', 'Green'),
            menuItem('LabelBlue', 'Blue'),
            menuItem('LabelBrown', 'Brown'),
            menuItem('LabelMagenta', 'Magenta'),
            menuItem('LabelOrange', 'Orange'),
            menuItem('LabelYellow', 'Yellow'),
            menuItem('LabelCyan', 'Cyan'),
            menuItem('LabelGray', 'Gray'),
          ]
        },
        { type: 'separator' },
        menuItem('RotateCW', 'Rotate 90° CW'),
        menuItem('RotateCCW', 'Rotate 90° CCW'),
        menuItem('DefaultOrientation', 'Default Orientation'),
      ],
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
    console.log('[BACKEND] Path for initial scan: ', ARGV.scanPath);
    console.log('[BACKEND] Catalog path: ', ARGV.catalogPath);
    await createWindow({
      scanPath: ARGV.scanPath,
      catalogPath: ARGV.catalogPath,
    });
  } else {
    for (const p of beforeReadyPaths) {
      await createWindow({ catalogPath: p });
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

ipcMain.on('show-destination-folder-dialog', async (event) => {
  const bw = BrowserWindow.getFocusedWindow();
  if (!bw) {
    return;
  }

  const path = (await dialog.showOpenDialog(bw, {
    title: 'Select Destination Folder',
    properties: ['openDirectory', 'createDirectory']
  })).filePaths[0];
  event.reply('show-destination-folder-dialog-reply', path || '');
});


ipcMain.on('show-media-file', async (_event: IpcMainEvent, path: string) => {
  shell.showItemInFolder(path);
});

function menuItem(id: string, label: string, accelerator?: string) {
  return {
    id,
    label,
    accelerator,
    click: function () {
      const win = BrowserWindow.getFocusedWindow();
      win?.webContents.send('action', id);
    }
  }
}

ipcMain.on('show-image-menu', async () => {
  const template = [
    menuItem('ShowMediaFile', 'Show Media File'),
    menuItem('ExportToFolder', 'Export To Folder...'),
    { type: 'separator' },
    {
      label: 'Rating',
      submenu: [
        menuItem('Rating0', 'None', 'Command+0'),
        { type: 'separator' },
        menuItem('Rating1', '★', 'Command+1'),
        menuItem('Rating2', '★★', 'Command+2'),
        menuItem('Rating3', '★★★', 'Command+3'),
        menuItem('Rating4', '★★★★', 'Command+4'),
        menuItem('Rating5', '★★★★★', 'Command+5'),
      ],
    },
    {
      label: 'Label',
      submenu: [
        menuItem('LabelNone', 'None', '0'),
        { type: 'separator' },
        menuItem('LabelRed', 'Red', '1'),
        menuItem('LabelGreen', 'Green', '2'),
        menuItem('LabelBlue', 'Blue', '3'),
        menuItem('LabelBrown', 'Brown', '4'),
        menuItem('LabelMagenta', 'Magenta', '5'),
        menuItem('LabelOrange', 'Orange', '6'),
        menuItem('LabelYellow', 'Yellow', '7'),
        menuItem('LabelCyan', 'Cyan', '8'),
        menuItem('LabelGray', 'Gray', '9'),
      ]
    },
    { type: 'separator' },
    menuItem('RotateCW', 'Rotate 90° CW', 'Command+]'),
    menuItem('RotateCCW', 'Rotate 90° CCW', 'Command+['),
    // TODO: implement flipping support.
    // item('FlipVertical', 'Flip Vertical'),
    // item('FlipHorizontal', 'Flip Horizontal'),
    menuItem('DefaultOrientation', 'Default Orientation'),
  ];

  // TODO: remove the type override.
  const menu = Menu.buildFromTemplate(template as any);
  menu.popup();
});

ipcMain.on('show-label-menu', async () => {
  const template = [
    menuItem('LabelNone', 'None', '0'),
    { type: 'separator' },
    menuItem('LabelRed', 'Red', '1'),
    menuItem('LabelGreen', 'Green', '2'),
    menuItem('LabelBlue', 'Blue', '3'),
    menuItem('LabelBrown', 'Brown', '4'),
    menuItem('LabelMagenta', 'Magenta', '5'),
    menuItem('LabelOrange', 'Orange', '6'),
    menuItem('LabelYellow', 'Yellow', '7'),
    menuItem('LabelCyan', 'Cyan', '8'),
    menuItem('LabelGray', 'Gray', '9'),
  ];

  // TODO: remove the type override.
  const menu = Menu.buildFromTemplate(template as any);
  menu.popup();
});

ipcMain.on('show-rating-menu', async () => {
  const template = [
    menuItem('Rating0', 'None', 'Command+0'),
    { type: 'separator' },
    menuItem('Rating1', '★', 'Command+1'),
    menuItem('Rating2', '★★', 'Command+2'),
    menuItem('Rating3', '★★★', 'Command+3'),
    menuItem('Rating4', '★★★★', 'Command+4'),
    menuItem('Rating5', '★★★★★', 'Command+5'),
  ];

  // TODO: remove the type override.
  const menu = Menu.buildFromTemplate(template as any);
  menu.popup();
});

ipcMain.on('update-menu-action-status', async (_, statusMap: { readonly [key: string]: boolean }) => {
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    return;
  }

  for (const key in statusMap) {
    const menuItem = menu.getMenuItemById(key);
    if (menuItem) {
      menuItem.enabled = statusMap[key];
    }
  }
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

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    return;
  }

  win.destroy();
});

ipcMain.on('confirm-closing-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    return;
  }

  const choice = dialog.showMessageBoxSync(
    {
      type: 'question',
      buttons: ['Save', 'Cancel', 'Don\'t save'],
      title: 'Unsaved Changes',
      message: 'Do you want to save the changes you made in the document?'
    });
  if (choice === 2) {
    win.destroy();
  } else if (choice === 1) {
    return;
  } else if (choice === 0) {
    win?.webContents.send('action', 'SaveAndClose');
  }
});

// For e2e tests.
ipcMain.on('raw:open-dev-tools', () => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.openDevTools();
  }
});

ipcMain.on('raw:resize-window-by', (_, width: number, height: number) => {
  for (const win of BrowserWindow.getAllWindows()) {
    const rect = win.getBounds();
    rect.width += width;
    rect.height += height;
    win.setBounds(rect);
  }
});

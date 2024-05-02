'use strict'
//
// App's icon is taken from here:
// https://www.metmuseum.org/art/collection/search/13325
// Portrait of a Gentleman, attributed to Henry Williams
//
import { release } from 'node:os';
import { fileURLToPath } from 'node:url';

import { ChildProcess, spawn } from 'child_process';
import { BrowserWindow, IpcMainEvent, Menu, NativeImage, app, dialog, ipcMain, nativeImage, protocol, session, shell } from 'electron';
import { readFile } from 'fs';
import path from 'path';
import { URL } from 'url';
import { OpenWithEntries } from '../../src/backend/api-model';
import { buildImageContextMenuTemplate } from './context-menu';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = path.join(__dirname, '../preload/index.mjs')

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

const isDevelopment = process.env.NODE_ENV === 'development';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows: BrowserWindow[] = [];

const beforeReadyPaths: string[] = [];

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])

// TODO: rewrite cleanly.
function createProtocol(scheme: any, customProtocol?: any) {
  (customProtocol || protocol).registerBufferProtocol(
    scheme,
    (request: any, respond: any) => {
      let pathName = new URL(request.url).pathname
      pathName = decodeURI(pathName) // Needed in case URL contains spaces

      readFile(path.join(process.env.DIST, pathName), (error, data) => {
        if (error) {
          console.error(
            `Failed to read ${pathName} on ${scheme} protocol`,
            error
          )
        }
        const extension = path.extname(pathName).toLowerCase()
        let mimeType = ''

        if (extension === '.js') {
          mimeType = 'text/javascript'
        } else if (extension === '.html') {
          mimeType = 'text/html'
        } else if (extension === '.css') {
          mimeType = 'text/css'
        } else if (extension === '.svg' || extension === '.svgz') {
          mimeType = 'image/svg+xml'
        } else if (extension === '.json') {
          mimeType = 'application/json'
        } else if (extension === '.wasm') {
          mimeType = 'application/wasm'
        }

        respond({ mimeType, data })
      })
    }
  )
}

async function startBackendProcess(catalogPath?: string): Promise<{ backend: ChildProcess, port: number, secret: string }> {
  return new Promise<{ backend: ChildProcess, port: number, secret: string }>((resolve, reject) => {
    let binaryPath: string;
    if (isDevelopment || process.env.IS_TEST) {
      binaryPath = 'newmedia_backend';
    } else {
      binaryPath = path.join(path.dirname(app.getAppPath()), '..', 'Resources', 'bin', 'backend', 'backend');
    }
    const binaryArgs: string[] = [];
    if (process.env.VITE_DEV_SERVER_URL) {
      let url: string = process.env.VITE_DEV_SERVER_URL;
      if (url.endsWith('/')) {
        url = url.substring(0, url.length - 1)
      }
      binaryArgs.push("--cors-allow-origin=" + url)
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

interface CreateWindowOptions {
  catalogPath?: string;
  scanPath?: string;
}

async function createWindow(options: CreateWindowOptions = {}) {
  console.log('[BACKEND] Starting process...');
  const { backend, port, secret } = await startBackendProcess(options.catalogPath);
  console.log(`[BACKEND] Process started (pid=${backend.pid}, port=${port}, secret=${secret}, path=${options.catalogPath})`);

  const additionalArguments: string[] = [];
  if (process.env.INSIDE_E2E_TEST) {
    additionalArguments.push('--inside-e2e-test')
  }

  // Create the browser window.
  const win = new BrowserWindow({
    title: 'simpledam (pre-alpha)' + (options.catalogPath ? ` - ${options.catalogPath}` : ''),
    width: 1024,
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#282828',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      additionalArguments,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    let url = process.env.VITE_DEV_SERVER_URL + '?port=' + port.toString() + '&secret=' + secret;
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

app.on('open-file', async (event: Electron.Event, path: string) => {
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

let appStartedQuitting = false;
app.on('before-quit', () => {
  appStartedQuitting = true;
  for (const win of windows) {
    win.close();
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (appStartedQuitting || process.platform !== 'darwin') {
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
                { name: 'simpledam catalogs', extensions: ['nmcatalog'] },
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
      label: 'Sort',
      submenu: [
        menuItem('SortByFileNameAsc', 'File Name (A→Z)'),
        menuItem('SortByFileNameDesc', 'File Name (Z→A)'),
        // TODO: uncomment when origin is properly handled.
        // { type: 'separator' },
        // menuItem('SortByOriginTimeAsc', 'Origin Time (Past→Future)'),
        // menuItem('SortByOriginTimeDesc', 'Origin Time (Furtue→Past)'),
        { type: 'separator' },
        menuItem('SortByFileCreationTimeAsc', 'File Creation Time (Past→Future)'),
        menuItem('SortByFileCreationTimeDesc', 'File Creation Time (Furtue→Past)'),
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

function menuItem(id: string, label: string, accelerator?: string, iconBase64?: string, ...actionArgs: readonly any[]) {
  let icon: NativeImage | undefined;
  if (iconBase64) {
    icon = nativeImage.createFromDataURL('data:image/png;base64,' + iconBase64).resize({
      width: 16,
      height: 16,
    });
  }

  return {
    id,
    label,
    icon,
    accelerator,
    click: function () {
      const win = BrowserWindow.getFocusedWindow();
      win?.webContents.send('action', id, ...actionArgs);
    }
  }
}

ipcMain.on('show-image-menu', async (_event: IpcMainEvent, openWithEntries?: OpenWithEntries) => {
  const template = buildImageContextMenuTemplate(openWithEntries);
  const menu = Menu.buildFromTemplate(template);
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

ipcMain.on('show-list-column-menu', async (_, currentIndex: number, availableColumns: string[]) => {
  const template = [
    menuItem('DeleteListColumn', 'Delete Column', null, null, currentIndex),
    { type: 'separator' },
    {
      label: 'Add Column Left',
      submenu: availableColumns.map((col) => {
        return menuItem('AddListColumn', col, null, null, currentIndex, col);
      }),
    },
    {
      label: 'Add Column Right',
      submenu: availableColumns.map((col) => {
        return menuItem('AddListColumn', col, null, null, currentIndex + 1, col);
      }),
    },
    { type: 'separator' },
    menuItem('SortListColumnAscending', 'Sort Ascending', null, null, currentIndex),
    menuItem('SortListColumnDescending', 'Sort Descending', null, null, currentIndex),
  ];

  const menu = Menu.buildFromTemplate(template);
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

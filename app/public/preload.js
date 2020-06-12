const { contextBridge, ipcRenderer, webFrame, BrowserWindow } = require('electron');

if (process.env.IS_NM_E2E_TEST) {
  contextBridge.exposeInMainWorld('rawElectron', {
    openDevTools() {
      ipcRenderer.send('raw:open-dev-tools')
    }
  });
}

contextBridge.exposeInMainWorld(
  'electron',
  {
    dragStart(paths, thumbnailUrl, callbackFn) {
      ipcRenderer.once('ondragstart-confirmed', callbackFn);
      ipcRenderer.send('ondragstart', paths, thumbnailUrl);
    },

    onSave(callbackFn) {
      ipcRenderer.on('save', callbackFn);
    },

    showSaveCatalogDialog(callbackFn) {
      ipcRenderer.once('show-save-catalog-dialog-reply', (event, path) => {
        callbackFn(path);
      });
      ipcRenderer.send('show-save-catalog-dialog');
    }
  }
)

webFrame.setZoomFactor(1);
webFrame.setVisualZoomLevelLimits(1, 1);

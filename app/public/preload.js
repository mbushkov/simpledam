const { contextBridge, ipcRenderer, webFrame } = require('electron')

contextBridge.exposeInMainWorld(
  'electron',
  {
    dragStart(paths, thumbnailUrl, callbackFn) {
      ipcRenderer.once('ondragstart-confirmed', callbackFn);
      ipcRenderer.send('dragstart', paths, thumbnailUrl);
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

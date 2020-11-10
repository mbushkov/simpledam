const { contextBridge, ipcRenderer, webFrame } = require('electron');

if (process.env.IS_NM_E2E_TEST) {
  contextBridge.exposeInMainWorld('rawElectron', {
    openDevTools() {
      ipcRenderer.send('raw:open-dev-tools')
    },

    resizeWindowBy(width, height) {
      ipcRenderer.send('raw:resize-window-by', width, height);
    },
  });
}

contextBridge.exposeInMainWorld(
  'electron',
  {
    dragStart(paths, thumbnailUrl, callbackFn) {
      ipcRenderer.once('ondragstart-confirmed', callbackFn);
      ipcRenderer.send('ondragstart', paths, thumbnailUrl);
    },

    showSaveCatalogDialog(callbackFn) {
      ipcRenderer.once('show-save-catalog-dialog-reply', (_event, path) => {
        callbackFn(path);
      });
      ipcRenderer.send('show-save-catalog-dialog');
    },

    showDestinationFolderDialog(callbackFn) {
      ipcRenderer.once('show-destination-folder-dialog-reply', (_event, path) => {
        callbackFn(path);
      });
      ipcRenderer.send('show-destination-folder-dialog');
    },

    showMediaFile(path) {
      ipcRenderer.send('show-media-file', path);
    },

    showImageMenu() {
      ipcRenderer.send('show-image-menu');
    },

    showLabelMenu() {
      ipcRenderer.send('show-label-menu');
    },

    showRatingMenu() {
      ipcRenderer.send('show-rating-menu');
    },
  }
)

// Forwarding to window.dispatchEvent seems to be the easiest approach when subscribing
// to events sent to the renderer process.
ipcRenderer.on('action', (_, actionName, ...args) => {
  window.dispatchEvent(new CustomEvent('nm-action', {
    detail: {
      actionName,
      args
    }
  }));
});

webFrame.setZoomFactor(1);
webFrame.setVisualZoomLevelLimits(1, 1);

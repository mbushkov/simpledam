export class ElectronHelperService {
  dragStart(paths: string[], thumbnailUrl: string, callbackFn: () => void) {
    (window as any).electron.dragStart(paths, thumbnailUrl, callbackFn);
  }

  onSave(callbackFn: () => void) {
    (window as any).electron.onSave(callbackFn);
  }

  showSaveCatalogDialog(callbackFn: (path: string) => void) {
    (window as any).electron.showSaveCatalogDialog(callbackFn);
  }
}

export const ELECTRON_HELPER_SERVICE = new ElectronHelperService();
export class ElectronHelperService {
  dragStart(paths: string[], thumbnailUrl: string, callbackFn: () => void) {
    (window as any).electron.dragStart(paths, thumbnailUrl, callbackFn);
  }

  showSaveCatalogDialog(callbackFn: (path: string) => void) {
    (window as any).electron.showSaveCatalogDialog(callbackFn);
  }

  showMediaFile(path: string) {
    (window as any).electron.showMediaFile(path);
  }

  showImageMenu() {
    (window as any).electron.showImageMenu();
  }
}

let _electronHelperService = new ElectronHelperService();

export function electronHelperService(): ElectronHelperService {
  return _electronHelperService;
}

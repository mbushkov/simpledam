export class ElectronHelperService {
  dragStart(paths: string[], thumbnailUrl: string, callbackFn: () => void) {
    (window as any).electron.dragStart(paths, thumbnailUrl, callbackFn);
  }

  showSaveCatalogDialog(callbackFn: (path: string) => void) {
    (window as any).electron.showSaveCatalogDialog(callbackFn);
  }

  showDestinationFolderDialog(callbackFn: (path: string) => void) {
    (window as any).electron.showDestinationFolderDialog(callbackFn);
  }

  showMediaFile(path: string) {
    (window as any).electron.showMediaFile(path);
  }

  showImageMenu() {
    (window as any).electron.showImageMenu();
  }

  showLabelMenu() {
    (window as any).electron.showLabelMenu();
  }

  showRatingMenu() {
    (window as any).electron.showRatingMenu();
  }

  updateMenuActionStatus(statusMap: { readonly [key: string]: boolean }) {
    (window as any).electron.updateMenuActionStatus(statusMap);
  }
}

let _electronHelperService: ElectronHelperService | undefined;

export function electronHelperService(): ElectronHelperService {
  if (_electronHelperService === undefined) {
    _electronHelperService = new ElectronHelperService();
  }
  return _electronHelperService;
}

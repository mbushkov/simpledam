import { type OpenWithEntries } from "@/backend/api-model";

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

  showImageMenu(openWithEntries?: OpenWithEntries) {
    (window as any).electron.showImageMenu(openWithEntries);
  }

  showLabelMenu() {
    (window as any).electron.showLabelMenu();
  }

  showRatingMenu() {
    (window as any).electron.showRatingMenu();
  }

  showListColumnMenu(currentIndex: number, availableColumns: string[]) {
    (window as any).electron.showListColumnMenu(currentIndex, availableColumns);
  }

  updateMenuActionStatus(statusMap: { readonly [key: string]: boolean }) {
    (window as any).electron.updateMenuActionStatus(statusMap);
  }

  closeWindow() {
    (window as any).electron.closeWindow();
  }

  confirmClosingWindow() {
    (window as any).electron.confirmClosingWindow();
  }
}

let _electronHelperServiceSingleton: ElectronHelperService | undefined;
export function electronHelperServiceSingleton(): ElectronHelperService {
  if (!_electronHelperServiceSingleton) {
    throw new Error('electronHelperServiceSingleton not set');
  }
  return _electronHelperServiceSingleton;
}

export function setElectronHelperServiceSingleton(value: ElectronHelperService) {
  _electronHelperServiceSingleton = value;
}

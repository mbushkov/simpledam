import { apiServiceSingleton } from '@/backend/api';
import { backendMirrorSingleton } from "@/backend/backend-mirror";
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { storeSingleton } from '@/store';
import log from 'loglevel';
import { computed } from 'vue';
import { Action } from './action';

export class SaveAction implements Action {
  readonly name = 'Save';
  readonly title = 'Save';
  readonly enabled = computed(() => true);

  async perform(catalogPath?: string): Promise<void> {
    if (catalogPath === undefined && !backendMirrorSingleton().state.catalogPath) {
      return new SaveAsAction().perform();
    } else {
      log.info('[App] Saving existing catalog to: ', backendMirrorSingleton().state.catalogPath);
      await apiServiceSingleton().saveStore(catalogPath ?? backendMirrorSingleton().state.catalogPath, storeSingleton().state);
    }
  }
}

export class SaveAndCloseAction implements Action {
  readonly name = 'SaveAndClose';
  readonly title = 'Save And Close';
  readonly enabled = computed(() => true);

  async perform(): Promise<void> {
    await new SaveAction().perform();
    electronHelperServiceSingleton().closeWindow();
  }
}

export class SaveAsAction implements Action {
  readonly name = 'SaveAs';
  readonly title = 'Save As...';
  readonly enabled = computed(() => true);

  async perform(): Promise<void> {
    return new Promise<void>(resolve => {
      (window as any).electron.showSaveCatalogDialog((path: string) => {
        if (path) {
          if (!path.endsWith('.nmcatalog')) {
            path += '.nmcatalog'
          }

          log.info('[App] Saving new catalog to: ', path);
          apiServiceSingleton().saveStore(path, storeSingleton().state);
        } else {
          log.info('[App] Save cancelled.');
        }

        resolve();
      });
    });
  }
}

export class ScanPathsAction implements Action {
  readonly name = 'ScanPaths';
  readonly title = 'Scan Paths...';
  readonly enabled = computed(() => true);

  async perform(paths?: readonly string[]): Promise<void> {
    if (paths) {
      await apiServiceSingleton().scanPaths(paths);
    }
  }
}
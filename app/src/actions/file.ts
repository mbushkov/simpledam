import { apiServiceSingleton } from '@/backend/api';
import { backendMirrorSingleton } from "@/backend/backend-mirror";
import { storeSingleton } from '@/store';
import { computed } from '@vue/composition-api';
import log from 'loglevel';
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
      apiServiceSingleton().saveStore(catalogPath ?? backendMirrorSingleton().state.catalogPath, storeSingleton().state);
    }
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


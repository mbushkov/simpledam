import { apiServiceSingleton } from '@/backend/api';
import { backendMirrorSingleton } from "@/backend/backend-mirror";
import { electronHelperService } from '@/lib/electron-helper-service';
import { storeSingleton } from '@/store';
import log from 'loglevel';
import { Action } from './action';

export class SaveAction implements Action {
  readonly name = 'Save';
  readonly title = 'Save';

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

export class ShowMediaFileAction implements Action {
  readonly name = 'ShowMediaFile';
  readonly title = 'Show Media File';

  async perform(): Promise<void> {
    const primarySelection = storeSingleton().state.selection.primary;
    if (!primarySelection) {
      return;
    }

    const path = storeSingleton().state.images[primarySelection].path;
    console.log('showing media file for', path);
    electronHelperService().showMediaFile(path);
  }
}
import * as log from 'loglevel';
import { ElectronHelperService, electronHelperServiceSingleton } from './electron-helper-service';

interface InternalDragContents {
  readonly kind: 'internal';
  readonly uids: string[];
}

interface ExternalDragContents {
  readonly kind: 'external';
  readonly paths: string[];
}

export interface DragResult {
  contents: InternalDragContents | ExternalDragContents;
  effect: 'copy' | 'move';
}

export interface UidAndPath {
  uid: string;
  path: string;
}

export class DragHelperService {
  private draggedFiles: UidAndPath[] = [];
  private draggedFilesMap: Map<string, UidAndPath> = new Map();
  private readonly electronHelperService: ElectronHelperService;

  constructor(_electronHelperService?: ElectronHelperService) {
    this.electronHelperService = _electronHelperService || electronHelperServiceSingleton();
  }

  startDrag(event: DragEvent, files: UidAndPath[], thumbnailUrl: string) {
    event.preventDefault();
    if (!event.dataTransfer) {
      log.warn('[DragHelperService] Unexpected empty dataTransfer property.');
      return
    }

    this.draggedFiles = [...files];
    this.draggedFilesMap = new Map(files.map(f => [f.path, f]));
    const paths = this.draggedFiles.map(f => f.path);

    event.dataTransfer.setData('nmUids', JSON.stringify(Array.from(this.draggedFiles.map(f => f.uid))));

    this.electronHelperService.dragStart(paths, thumbnailUrl, () => {
      log.info(`[DragHelperService] Dragging ${files.length} files.`);

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'copyMove';
      }
    });
  }

  private _getDragResult(event: DragEvent): DragResult | undefined {
    const effect = event.dataTransfer?.dropEffect == 'copy' ? 'copy' : 'move';
    const nmUids = event.dataTransfer?.getData('nmUids');
    if (nmUids) {
      const parsedNmUids = JSON.parse(nmUids);
      log.info(`[DragHelperService] Dragging finished with ${parsedNmUids.length} internal references.`);

      return {
        contents: {
          kind: 'internal',
          uids: parsedNmUids,
        },
        effect,
      };
    }

    const files = event.dataTransfer?.files;
    if (!files) {
      return undefined;
    }
    log.info(`[DragHelperService] Checking ${files.length} file(s).`);
    let fullMatch: boolean = true;
    for (let i = 0; i < files.length; ++i) {
      const p = files.item(i)!.path;
      if (!this.draggedFilesMap.has(p)) {
        fullMatch = false;
        break;
      }
    }

    if (fullMatch) {
      log.info(`[DragHelperService] Dragging finished with ${this.draggedFiles.length} found internal references.`);
      return {
        contents: {
          kind: 'internal',
          uids: this.draggedFiles.map(f => f.uid),
        },
        effect,
      };
    } else {
      const paths: string[] = [];
      for (let i = 0; i < files.length; ++i) {
        const fi = files.item(i);
        if (fi?.path) {
          paths.push(fi.path);
        }
      }
      log.info(`[DragHelperService] Dragging finished with ${paths.length} external files.`)
      return {
        contents: {
          kind: 'external',
          paths,
        },
        effect,
      };
    }
  }

  finishDrag(event: DragEvent): DragResult | undefined {
    try {
      return this._getDragResult(event);
    } finally {
      this.cancelDrag();
    }
  }

  cancelDrag() {
    this.draggedFiles = [];
    this.draggedFilesMap = new Map();
  }

  eventHasFiles(event: DragEvent) {
    return event.dataTransfer?.getData('nmUids') || event.dataTransfer?.files;
  }
}

let _dragHelperServiceSingleton: DragHelperService | undefined;
export function dragHelperServiceSingleton(): DragHelperService {
  if (!_dragHelperServiceSingleton) {
    throw new Error('dragHelperServiceSingleton not set');
  }
  return _dragHelperServiceSingleton;
}

export function setDragHelperServiceSingleton(value: DragHelperService) {
  _dragHelperServiceSingleton = value;
}

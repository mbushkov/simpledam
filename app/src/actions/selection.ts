import ExportToFolder from '@/components/modals/ExportToFolder.vue';
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { modalHelperServiceSingleton } from '@/lib/modal-helper-service';
import { storeSingleton } from '@/store';
import { Label, Rating } from "@/store/schema";
import { computed } from 'vue';
// import { ModalProgrammatic } from 'buefy';
import { Action } from './action';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function labelAction(label: Label): Action {
  return {
    name: `Label${capitalize(Label[label])}`,
    title: `Label With ${capitalize(Label[label])}`,
    enabled: computed(() => storeSingleton().state.selection.primary !== undefined),

    async perform(): Promise<void> {
      storeSingleton().labelSelection(label);
    }
  }
}

function rateAction(rating: Rating): Action {
  return {
    name: `Rating${rating}`,
    title: `Rate As ${rating}`,
    enabled: computed(() => storeSingleton().state.selection.primary !== undefined),

    async perform(): Promise<void> {
      storeSingleton().rateSelection(rating);
    }
  }
}

export function labelActions(): ReadonlyArray<Action> {
  const result: Action[] = [];
  for (const value in Label) {
    const n = Number.parseInt(value);
    if (!Number.isNaN(n)) {
      result.push(labelAction(n));
    }
  }
  return result;
}

export function rateActions(): ReadonlyArray<Action> {
  const result: Action[] = [];
  for (let i = 0; i <= 5; ++i) {
    result.push(rateAction(i as Rating));
  }
  return result;
}

export class RotateCWAction implements Action {
  readonly name = 'RotateCW';
  readonly title = 'Rotate 90° CW';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    storeSingleton().rotateRight();
  }
}

export class RotateCCWAction implements Action {
  readonly name = 'RotateCCW';
  readonly title = 'Rotate 90° CCW';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    storeSingleton().rotateLeft();
  }
}

export class FlipHorizontalAction implements Action {
  readonly name = 'FlipHorizontal';
  readonly title = 'Flip Horizontal';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    storeSingleton().flipHorizontally();
  }
}

export class FlipVerticalAction implements Action {
  readonly name = 'FlipVertical';
  readonly title = 'Flip Vertical';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    storeSingleton().flipVertically();
  }
}

export class DefaultOrientationAction implements Action {
  readonly name = 'DefaultOrientation';
  readonly title = 'Default Orientation';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    storeSingleton().rotateToDefault();
  }
}

export class SelectAllAction implements Action {
  readonly name = 'SelectAll';
  readonly title = 'Select All';
  readonly enabled = computed(() => true);

  async perform(): Promise<void> {
    storeSingleton().selectAll();
  }
}

export class DeselectAllAction implements Action {
  readonly name = 'DeselectAll';
  readonly title = 'Deselect All';
  readonly enabled = computed(() => true);

  async perform(): Promise<void> {
    storeSingleton().selectPrimary(undefined);
  }
}

export class ShowMediaFileAction implements Action {
  readonly name = 'ShowMediaFile';
  readonly title = 'Show Media File';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    const primarySelection = storeSingleton().state.selection.primary;
    if (!primarySelection) {
      return;
    }

    const path = storeSingleton().state.images[primarySelection].path;
    console.log('showing media file for', path);
    electronHelperServiceSingleton().showMediaFile(path);
  }
}

export class ExportToFolderAction implements Action {
  readonly name = 'ExportToFolder';
  readonly title = 'Export To Folder';
  readonly enabled = computed(() => storeSingleton().state.selection.primary !== undefined);

  async perform(): Promise<void> {
    console.log(ExportToFolder);
    modalHelperServiceSingleton().openModal(ExportToFolder);
    // ModalProgrammatic.open({
    //   width: 500,
    //   component: ExportToFolder,
    //   trapFocus: true,
    //   canCancel: false,
    // })
  }
}
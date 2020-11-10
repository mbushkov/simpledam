import ExportToFolder from '@/components/modals/ExportToFolder.vue';
import { storeSingleton } from '@/store';
import { Label, Rating } from "@/store/schema";
import { ModalProgrammatic } from 'buefy';
import { Action } from './action';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function labelAction(label: Label): Action {
  return {
    name: `Label${capitalize(Label[label])}`,
    title: `Label With ${capitalize(Label[label])}`,

    async perform(): Promise<void> {
      storeSingleton().labelSelection(label);
    }
  }
}

function rateAction(rating: Rating): Action {
  return {
    name: `Rating${rating}`,
    title: `Rate As ${rating}`,

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

  async perform(): Promise<void> {
    storeSingleton().rotateRight();
  }
}

export class RotateCCWAction implements Action {
  readonly name = 'RotateCCW';
  readonly title = 'Rotate 90° CCW';

  async perform(): Promise<void> {
    storeSingleton().rotateLeft();
  }
}

export class FlipHorizontalAction implements Action {
  readonly name = 'FlipHorizontal';
  readonly title = 'Flip Horizontal';

  async perform(): Promise<void> {
    storeSingleton().flipHorizontally();
  }
}

export class FlipVerticalAction implements Action {
  readonly name = 'FlipVertical';
  readonly title = 'Flip Vertical';

  async perform(): Promise<void> {
    storeSingleton().flipVertically();
  }
}

export class DefaultOrientationAction implements Action {
  readonly name = 'DefaultOrientation';
  readonly title = 'Default Orientation';

  async perform(): Promise<void> {
    storeSingleton().rotateToDefault();
  }
}

export class ExportToFolderAction implements Action {
  readonly name = 'ExportToFolder';
  readonly title = 'Export To Folder';

  async perform(): Promise<void> {
    ModalProgrammatic.open({
      component: ExportToFolder,
      trapFocus: true,
    })
  }
}
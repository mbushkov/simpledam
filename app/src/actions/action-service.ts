import { ElectronHelperService } from '@/lib/electron-helper-service';
import log from 'loglevel';
import { reactive, watchEffect } from 'vue';
import { type Action } from './action';

export class ActionService {
  private readonly _actions: { [key: string]: Action } = {};

  // Note: Vue 2 reactivity system doesn't detect keys if they're added to the top level of a reactive object.
  private readonly _statusState = reactive({
    statusByAction: {} as { [key: string]: boolean },
  });

  constructor(electronHelperService: ElectronHelperService) {
    watchEffect(() => {
      electronHelperService.updateMenuActionStatus({ ...this.statusMap });
    });
  }

  registerAction(action: Action) {
    this._actions[action.name] = action;

    watchEffect(() => {
      if (this._statusState.statusByAction[action.name] !== action.enabled.value) {
        this._statusState.statusByAction[action.name] = action.enabled.value;
      }
    });
  }

  async performAction(name: string, ...args: any[]): Promise<void> {
    const action = this._actions[name];
    if (!action) {
      throw new Error('Could not find action: ' + name);
    }
    log.info('Performing action: ', name, args);
    return (action.perform as (...args: any) => Promise<void>).apply(action, args);
  }

  get actions(): { readonly [key: string]: Action } {
    return this._actions;
  }

  get statusMap(): { readonly [key: string]: boolean } {
    return this._statusState.statusByAction;
  }
}


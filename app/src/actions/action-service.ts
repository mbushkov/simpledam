import log from 'loglevel';
import { Action } from './action';

export class ActionService {
  private readonly _actions: { [key: string]: Action } = {};

  registerAction(action: Action) {
    this._actions[action.name] = action;
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
}


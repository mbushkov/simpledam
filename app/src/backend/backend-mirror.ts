import { apiServiceSingleton } from './api';
import { filter, map } from 'rxjs/operators';
import { reactive } from '@vue/composition-api';
import * as log from 'loglevel';
import Vue from 'vue';

export declare interface LongOperationStatus {
  readonly status: string;
  readonly progress: number;
}

export declare interface BackendState {
  readonly catalogPath: string;
  readonly previewQueueSize: number;
  readonly longOperations: { readonly [key: string]: LongOperationStatus };
}

declare interface Action {
  action: string;
}

declare interface BackendStateUpdateAction extends Action {
  state: any;
}


class BackendMirror {

  private readonly apiService = apiServiceSingleton();

  readonly state: BackendState = reactive<BackendState>({
    catalogPath: '',
    previewQueueSize: 0,
    longOperations: {},
  });

  readonly updateBackendState$ = this.apiService.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'BACKEND_STATE_UPDATE';
    }),
    map((v) => {
      log.debug('[BackendMirror] Got state update: ', v);

      const a = v as BackendStateUpdateAction;
      for (const key in a.state) {
        Vue.set(this.state, key, a.state[key]);
      }
    }),
  ).subscribe();
}


let _backendMirror: BackendMirror | undefined;
export function backendMirrorSingleton() {
  if (!_backendMirror) {
    _backendMirror = new BackendMirror();
  }

  return _backendMirror;
}

import { API_SERVICE } from './api';
import { filter, map, catchError } from 'rxjs/operators';
import Vue from 'vue';

export declare interface BackendState {
  readonly catalogPath: string;
  readonly previewQueueSize: number;
  readonly catalogOpName?: string;
  readonly catalogOpProgress?: number;
}

declare interface Action {
  action: string;
}

declare interface BackendStateUpdateAction extends Action {
  state: any;
}


class BackendMirror {

  readonly state: BackendState = Vue.observable<BackendState>({
    catalogPath: '',
    previewQueueSize: 0,
  });

  readonly updateBackendState$ = API_SERVICE.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'BACKEND_STATE_UPDATE';
    }),
    map((v) => {
      const a = v as BackendStateUpdateAction;
      for (let key in a.state) {
        (this.state as any)[key] = a.state[key];
      }
    }),
    catchError((err, caught) => {  // defensive approach
      console.log('Error: ', err);
      return caught;
    }),
  ).subscribe();
}


export const BACKEND_MIRROR = new BackendMirror();
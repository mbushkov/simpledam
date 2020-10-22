import { apiServiceSingleton } from './api';
import { filter, map } from 'rxjs/operators';
import Vue from 'vue';
import { reactive } from '@vue/composition-api';

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

  private readonly apiService = apiServiceSingleton();

  readonly state: BackendState = reactive<BackendState>({
    catalogPath: '',
    previewQueueSize: 0,
  });

  readonly updateBackendState$ = this.apiService.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'BACKEND_STATE_UPDATE';
    }),
    map((v) => {
      const a = v as BackendStateUpdateAction;
      for (const key in a.state) {
        (this.state as any)[key] = a.state[key];
      }
    }),
  ).subscribe();
}


export const BACKEND_MIRROR = new BackendMirror();
import { type BackendStateUpdateAction } from '@/backend/actions';
import * as log from 'loglevel';
import { filter, map } from 'rxjs/operators';
import { reactive } from 'vue';
import { ApiService } from './api';

export declare interface BackendState {
  readonly catalogPath: string;
  readonly previewQueueSize: number;
}

export class BackendMirror {

  constructor(private readonly apiService: ApiService) { }

  private readonly updateBackendState$ = this.apiService.ws.pipe(
    filter((v) => {
      return v.action === 'BACKEND_STATE_UPDATE';
    }),
    map((v) => {
      log.debug('[BackendMirror] Got state update: ', v);

      const a = v as BackendStateUpdateAction;
      Object.assign(this.state, a.state);
    }),
  ).subscribe();

  readonly state: BackendState = reactive<BackendState>({
    catalogPath: '',
    previewQueueSize: 0,
  });
}


let _backendMirrorSingleton: BackendMirror | undefined;

export function backendMirrorSingleton(): BackendMirror {
  if (!_backendMirrorSingleton) {
    throw new Error('backendMirrorSingleton not set');
  }
  return _backendMirrorSingleton;
}

export function setBackendMirrorSingleton(value: BackendMirror) {
  _backendMirrorSingleton = value;
}
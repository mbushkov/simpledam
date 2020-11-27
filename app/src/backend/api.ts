import { ReadonlyState, State } from '@/store/schema';
import axios from 'axios';
import * as log from 'loglevel';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { Action } from './actions';

const GLOBAL_URL_PARAMS = new URLSearchParams(window.location.search);
export const PORT = Number(GLOBAL_URL_PARAMS.get('port'));
export const SECRET = GLOBAL_URL_PARAMS.get('secret');
export const INITIAL_SCAL_PATH = GLOBAL_URL_PARAMS.get('scan-path');

export interface ExportToPathOptions {
  prefix_with_index: boolean;
}

export class ApiService {
  readonly BASE_ADDRESS = `localhost:${PORT}`;
  readonly ROOT = 'http://' + this.BASE_ADDRESS;
  readonly HEADERS = {
    'X-nm-secret': SECRET,
  };

  constructor(ws: Observable<unknown> | undefined = undefined) {
    if (INITIAL_SCAL_PATH) {
      this.scanPath(INITIAL_SCAL_PATH);
    }

    this.ws = (ws ?? webSocket(`ws://${this.BASE_ADDRESS}/ws`)).pipe(
      catchError(err => {
        log.info('[API] WebSocket connection broken (retry is due): ', err);
        // Chromium will close the websocket evert time the system goes to sleep.
        // Thus, it's necessary to retry.
        return webSocket(`ws://${this.BASE_ADDRESS}/ws`);
      }),
      map(v => v as Action),
    );

    this.ws.subscribe({
      next(i) {
        if (log.getLevel() <= log.levels.TRACE) {
          log.trace('[API] Got WebSocket message: ', i);
        }
      }
    });
  }

  readonly ws: Observable<Action>;

  async scanPath(path: string): Promise<void> {
    const response = await axios.post(this.ROOT + '/scan-path', { path }, { headers: this.HEADERS });
    log.info('[API] Scan path response: ', response);
  }

  async movePath(src: string, dest: string): Promise<void> {
    const response = await axios.post(this.ROOT + '/move-path', { src, dest }, { headers: this.HEADERS });
    log.info('[API] Move path response: ', response);
  }

  async exportToPath(srcs: string[], dest: string, options: ExportToPathOptions): Promise<void> {
    const response = await axios.post(this.ROOT + '/export-to-path', { srcs, dest, options }, { headers: this.HEADERS });
    log.info('[API] Export to path response: ', response);
  }

  async saveStore(path: string, state: ReadonlyState): Promise<void> {
    const replacer = (key: string, value: unknown) => value === undefined ? null : value;
    const stringified = JSON.stringify({ path, state }, replacer);

    const response = await axios.post(this.ROOT + '/save', stringified, { headers: this.HEADERS });
    log.info('[API] Save store response: ', response);
  }

  private replaceNullWithUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    const objKeys = Object.keys(obj);
    objKeys.forEach((key) => {
      if (obj[key] === null) {
        obj[key] = undefined;
      }
      if (typeof (obj[key]) == "object") {
        this.replaceNullWithUndefined(obj[key]);
      }
    });

    return obj;
  }

  async fetchState(): Promise<State | undefined> {
    const response = await axios.get(this.ROOT + '/saved-state', { responseType: 'text', headers: this.HEADERS });
    log.info('[API] Fetch state response: ', response);
    return this.replaceNullWithUndefined(response.data['state'] || undefined);
  }

  thumbnailUrl(uid: string) {
    return this.ROOT + '/images/' + uid;
  }
}

let _apiServiceSingleton: ApiService | undefined;

export function apiServiceSingleton(): ApiService {
  if (!_apiServiceSingleton) {
    throw new Error('apiServiceSingleton not set');
  }

  return _apiServiceSingleton;
}

export function setApiServiceSingleton(value: ApiService) {
  _apiServiceSingleton = value;
}

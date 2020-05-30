import axios from 'axios';
import { webSocket } from 'rxjs/webSocket';
import { State, ReadonlyState } from './store';
import { retry } from 'rxjs/operators';

const GLOBAL_URL_PARAMS = new URLSearchParams(window.location.search);
export const PORT = Number(GLOBAL_URL_PARAMS.get('port'));
export const SECRET = GLOBAL_URL_PARAMS.get('secret');


class ApiService {
  readonly BASE_ADDRESS = `localhost:${PORT}`;
  readonly ROOT = 'http://' + this.BASE_ADDRESS;
  readonly HEADERS = {
    'X-nm-secret': SECRET,
  };

  readonly ws = webSocket(`ws://${this.BASE_ADDRESS}/ws`).pipe(
    // Chromium will close the websocket evert time the system goes to sleep.
    // Thus, it's necessary to retry.
    retry(),
  );

  // readonly wsLogging = this.ws.subscribe(i => {
  //   console.log('Got WebSocket data', i);
  // });

  scanPath(path: string): Promise<void> {
    return axios.post(this.ROOT + '/scan-path', { path }, { headers: this.HEADERS }).then(r => {
      console.log(r);
    });
  }

  movePath(src: string, dest: string): Promise<void> {
    return axios.post(this.ROOT + '/move-path', { src, dest }, { headers: this.HEADERS }).then(r => {
      console.log(r);
    });
  }

  saveStore(path: string, state: ReadonlyState): Promise<void> {
    const replacer = (key: string, value: unknown) => value === undefined ? null : value;
    const stringified = JSON.stringify({ path, state }, replacer);

    return axios.post(this.ROOT + '/save', stringified, { headers: this.HEADERS }).then(r => {
      console.log(r);
    });
  }

  private replaceNullWithUndefined(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    var objKeys = Object.keys(obj);
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

  fetchState(): Promise<State | undefined> {
    return axios.get(this.ROOT + '/saved-state', { responseType: 'text', headers: this.HEADERS }).then(r => {
      return this.replaceNullWithUndefined(r.data['state'] || undefined);
    });
  }

  // fetchRoot() {
  // axios.post(this.ROOT + '/scan-path', {path: '/Volumes/Somme/Temp/for_lukasz_large_selection'}).then(r => {
  // axios.post(this.ROOT + '/scan-path', {path: '/Volumes/Somme/Temp/clavarino_print'}).then(r => {
  // axios.post(this.ROOT + '/scan-path', {path: '/Users/bushman/Downloads/test print 2'}).then(r => {
  // console.log(r);
  // });
  // }

  thumbnailUrl(uid: string) {
    return this.ROOT + '/images/' + uid;
  }
}

export const API_SERVICE = new ApiService();
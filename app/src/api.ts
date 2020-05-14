import axios from 'axios';
import { webSocket } from 'rxjs/webSocket';

const GLOBAL_URL_PARAMS = new URLSearchParams(window.location.search);
export const PORT = Number(GLOBAL_URL_PARAMS.get('port'));


class ApiService {
  readonly BASE_ADDRESS = `127.0.0.1:${PORT}`;
  readonly ROOT = 'http://' + this.BASE_ADDRESS;

  readonly ws = webSocket(`ws://${this.BASE_ADDRESS}/ws`);

  readonly wsLogging = this.ws.subscribe(i => {
    // console.log('Got WebSocket data', i);
  });

  scanPath(path: string) {
    axios.post(this.ROOT + '/scan-path', { path }).then(r => {
      console.log(r);
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
import axios from 'axios';
import {webSocket} from 'rxjs/webSocket';

class ApiService {
  readonly BASE_ADDRESS = '127.0.0.1:30000'
  readonly ROOT = 'http://' + this.BASE_ADDRESS;

  readonly ws = webSocket(`ws://${this.BASE_ADDRESS}/ws`);

  readonly wsLogging = this.ws.subscribe(i => {
    console.log('Got WebSocket data', i);
  });

  fetchRoot() {
    axios.post(this.ROOT + '/scan-path', {path: '/Users/bushman/Downloads/test print 2'}).then(r => {
      console.log(r);
    });
  }
}

export const API_SERVICE = new ApiService();
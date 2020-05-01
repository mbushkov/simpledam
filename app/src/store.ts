import Vue from 'vue';
import { API_SERVICE } from '@/api';
import { filter, map } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

declare interface Action {
  action: string;
}

declare interface FileRegisteredAction extends Action {
  image: ImageFile;
}

export declare interface Size {
  width: number;
  height: number;
}

export declare interface ImageFile {
  path: string;
  preview_size: Size;
  size: Size;
  uid: string;
}

export declare interface State {
  images: { [key: string]: ImageFile };
}

class Store {
  state: State = Vue.observable({
    images: {},
  });

  state$ = new ReplaySubject<State>(1);

  readonly registerImage$ = API_SERVICE.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'FILE_REGISTERED';
    }),
    map((v) => {
      const a = v as FileRegisteredAction;
      this.registerImage(a.image);
    })
  ).subscribe();

  private registerImage(imageFile: ImageFile) {
    console.log('registering image', imageFile);
    Vue.set(this.state.images, imageFile.uid, imageFile);
  }
}

export const STORE = new Store();
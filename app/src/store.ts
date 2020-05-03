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
  preview_timestamp: number;
  size: Size;
  uid: string;
}

export declare enum Label {
  NONE,
  RED,
  GREEN,
  BLUE,
  BROWN,
  MAGENTA,
  ORANGE,
  YELLOW,
  CYAN,
  GRAY,
}

type StarRating = 0|1|2|3|4|5;

export declare interface ImageMetadata {
  starRating: StarRating;
  label: Label;
}

export declare interface ImageList {
  presenceMap: {[key: string]: boolean};
  items: string[];
}

export declare interface FilterSettings {
  selectedLabels: Label[];
  selectedStarRatings: StarRating[];
}

function filterSettingsInvariant(fs:FilterSettings): string {
  const l = [...fs.selectedLabels];
  l.sort();

  const s = [...fs.selectedStarRatings];
  s.sort();

  return l.map(i => `label:${i}`).concat(s.map(i => `star:${i}`)).join('|');
}

export declare interface Selection {
  primary?: string;
  additional: {[key: string]: boolean};
}

export declare interface State {
  filterSerttings: FilterSettings;
  filtersInvariant: string;
  
  selection: Selection;

  images: { [key: string]: ImageFile };
  metadata: { [key: string]: ImageMetadata };
  lists: { [key: string]: ImageList };
}

class Store {
  state: State = Vue.observable({
    filterSerttings: {
      selectedLabels: [],
      selectedStarRatings: [],
    },
    filtersInvariant: '',

    selection: {
      additional: {},
    },

    images: {},
    metadata: {},
    lists: {},
  });

  state$ = new ReplaySubject<State>(1);

  readonly registerImage$ = API_SERVICE.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'FILE_REGISTERED' || (v as Action).action === 'THUMBNAIL_UPDATED';
    }),
    map((v) => {
      const a = v as FileRegisteredAction;
      this.registerImage(a.image);
    })
  ).subscribe();

  public currentList(): ImageList {
    let list = this.state.lists[this.state.filtersInvariant];
    if (list === undefined) {
      list = {
        presenceMap: {},
        items: [],
      };
      Vue.set(this.state.lists,this.state.filtersInvariant, list);
    }
    return list;
  }

  public selectPrimary(uid?: string) {
    Vue.set(this.state.selection, 'primary', uid);
  }

  private ensureItemInCurrentList(uid: string) {
    const l = this.currentList();
    if (!l.presenceMap[uid]) {
      Vue.set(l.presenceMap,uid, true);
      l.items.push(uid);
    }
  }

  private registerImage(imageFile: ImageFile) {
    // console.log('registering image', imageFile);
    Vue.set(this.state.images, imageFile.uid, imageFile);
    this.ensureItemInCurrentList(imageFile.uid);
  }
}

export const STORE = new Store();
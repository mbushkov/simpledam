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

export enum Label {
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
  filterSettings: FilterSettings;
  filtersInvariant: string;
  
  columnCount: number,
  selection: Selection;

  images: { [key: string]: ImageFile };
  metadata: { [key: string]: ImageMetadata };
  lists: { [key: string]: ImageList };
}

export enum Direction {
  UP,
  DOWN,
  RIGHT,
  LEFT,
}

class Store {
  state: State = Vue.observable({
    filterSettings: {
      selectedLabels: [],
      selectedStarRatings: [],
    },
    filtersInvariant: '',

    columnCount: 1,
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
    return this.listForFilterSettingsInvariant(this.state.filtersInvariant);
  }

  public listForFilterSettingsInvariant(invariant: string): ImageList {
    let list = this.state.lists[invariant];
    if (list === undefined) {
      list = {
        presenceMap: {},
        items: [],
      };
      Vue.set(this.state.lists, invariant, list);
    }
    return list;
  }

  public selectPrimary(uid?: string) {
    Vue.set(this.state.selection, 'primary', uid);
  }

  public movePrimarySelection(direction: Direction) {
    if (!this.state.selection.primary) {
      return;
    }

    const l = this.currentList();
    const curIndex = l.items.indexOf(this.state.selection.primary);

    if (direction === Direction.RIGHT) {
      if (curIndex < l.items.length) {
        this.selectPrimary(l.items[curIndex + 1]);
      }
    } else if (direction === Direction.LEFT) {
      if (curIndex > 0) {
        this.selectPrimary(l.items[curIndex - 1]);
      }
    } else if (direction == Direction.DOWN) {
      this.selectPrimary(l.items[Math.min(curIndex + this.state.columnCount, l.items.length - 1)]);
    } else if (direction == Direction.UP) {
      this.selectPrimary(l.items[Math.max(curIndex - this.state.columnCount, 0)]);
    }
  }

  public numItemsMatchingFilter(filterSettings: FilterSettings): number {
    const invariant = filterSettingsInvariant(filterSettings);
    return this.state.lists[invariant]?.items.length ?? 0;
  }

  public labelSelection(label:Label) {
    if (!this.state.selection.primary) {
      return;
    }

    for (let sel of Object.keys(this.state.selection.additional).concat(this.state.selection.primary)) {
      const prevLabel = this.state.metadata[sel].label;
      Vue.set(this.state.metadata[sel], 'label', label);
      
      if (prevLabel !== label) {
        this.ensureItemInCurrentList(sel);
        this.ensureItemInList(sel, filterSettingsInvariant({
          selectedLabels: [label],
          selectedStarRatings: [],
        }));
        this.removeItemFromList(sel, filterSettingsInvariant({
          selectedLabels: [prevLabel],
          selectedStarRatings: [],
        }));
      }
    }
  }

  public updateColumnCount(n:number) {
    this.state.columnCount = n;
  }

  public changeLabelFilter(label:Label, state:boolean) {
    const index = this.state.filterSettings.selectedLabels.indexOf(label);
    if (state && index === -1) {
      this.state.filterSettings.selectedLabels.push(label);
    } else if (!state && index !== -1) {
      this.state.filterSettings.selectedLabels.splice(index, 1);
    }

    this.state.filtersInvariant = filterSettingsInvariant(this.state.filterSettings);
    for (let uid in this.state.images) {
      this.ensureItemInCurrentList(uid);
    }
    this.selectPrimary(undefined);
  }

  public toggleLabelFilter(label:Label) {
    const present = this.state.filterSettings.selectedLabels.indexOf(label) !== -1;
    this.changeLabelFilter(label, !present);
  }

  private isMatchingFilterSettings(mdata:ImageMetadata):boolean {
    const fs = this.state.filterSettings;
    const matchesLabel = ((fs.selectedLabels.length === 0) || fs.selectedLabels.indexOf(mdata.label) !== -1);
    const matchesStarRating = ((fs.selectedStarRatings.length === 0) || fs.selectedStarRatings.indexOf(mdata.starRating) !== -1);

    return matchesLabel && matchesStarRating;
  }

  private removeItemFromList(uid: string, invariant:string) {
    const l = this.listForFilterSettingsInvariant(invariant);
    const li = l.items.indexOf(uid);
    if (li !== -1) {
      l.items.splice(li, 1);
      Vue.delete(l.presenceMap, uid);
    }
  }

  private ensureItemInList(uid: string, invariant: string) {
    const mdata = this.state.metadata[uid];

    const l = this.listForFilterSettingsInvariant(invariant);
    if (this.isMatchingFilterSettings(mdata)) {
      if (!l.presenceMap[uid]) {
        Vue.set(l.presenceMap,uid, true);
        l.items.push(uid);
      }
    } else {
      if (l.presenceMap[uid]) {
        Vue.delete(l.presenceMap, uid);
        l.items.splice(l.items.indexOf(uid), 1);
      }
      if (this.state.selection.primary === uid) {
        this.selectPrimary(undefined);
      }
    }
  }

  private ensureItemInCurrentList(uid: string) {
    this.ensureItemInList(uid, this.state.filtersInvariant);
  }

  private registerImage(imageFile: ImageFile) {
    // console.log('registering image', imageFile);
    Vue.set(this.state.images, imageFile.uid, imageFile);

    const imageMetadata: ImageMetadata = {
      label: Label.NONE,
      starRating: 0,
    };
    Vue.set(this.state.metadata, imageFile.uid, imageMetadata);
    this.ensureItemInCurrentList(imageFile.uid);
  }
}

export const STORE = new Store();
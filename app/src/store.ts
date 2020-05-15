import { API_SERVICE } from '@/api';
import { filter, map, bufferTime } from 'rxjs/operators';
import Vue from 'vue';

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

type StarRating = 0 | 1 | 2 | 3 | 4 | 5;

export declare interface ImageMetadata {
  starRating: StarRating;
  label: Label;
}

export declare interface ImageList {
  presenceMap: { [key: string]: boolean };
  items: string[];
}

export declare interface FilterSettings {
  selectedLabels: Label[];
  selectedStarRatings: StarRating[];
}

function filterSettingsInvariant(fs: FilterSettings): string {
  const l = [...fs.selectedLabels];
  l.sort();

  const s = [...fs.selectedStarRatings];
  s.sort();

  return l.map(i => `label:${i}`).concat(s.map(i => `star:${i}`)).join('|');
}

export declare interface Selection {
  primary: string | undefined;
  lastTouched: string | undefined;
  additional: { [key: string]: boolean };
}

export declare interface State {
  version: number;

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
    version: 1,

    filterSettings: {
      selectedLabels: [],
      selectedStarRatings: [],
    },
    filtersInvariant: '',


    columnCount: 1,

    selection: {
      primary: undefined,
      lastTouched: undefined,
      additional: {},
    },

    images: {},
    metadata: {},
    lists: {},
  });

  readonly registerImage$ = API_SERVICE.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'FILE_REGISTERED' || (v as Action).action === 'THUMBNAIL_UPDATED';
    }),
    // TODO: buffer only on high throughput (implement cutom operator).
    // See https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457?gi=5406b4c675c2
    bufferTime(500),
    map((vList) => {
      const aList = vList as FileRegisteredAction[];
      this.registerImages(aList.map(a => a.image));
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
    this.state.selection.lastTouched = uid;

    if (this.state.selection.primary !== uid) {
      this.state.selection.primary = uid;
      this.state.selection.additional = {};
    }
  }

  public toggleAdditionalSelection(uid: string) {
    this.state.selection.lastTouched = uid;

    if (this.state.selection.primary === uid) {
      let newPrimary = undefined;
      const aKeys = Object.keys(this.state.selection.additional);
      if (aKeys.length > 0) {
        newPrimary = aKeys[0];
        Vue.delete(this.state.selection.additional, newPrimary);
      }
      this.state.selection.primary = newPrimary;
    } else {
      if (this.state.selection.primary === undefined) {
        this.selectPrimary(uid);
        return;
      }

      if (this.state.selection.additional[uid]) {
        Vue.delete(this.state.selection.additional, uid);
      } else {
        Vue.set(this.state.selection.additional, uid, true);
      }
    }
  }

  public selectRange(uid: string) {
    if (!this.state.selection.primary) {
      return;
    }

    const l = this.currentList();
    const primaryIndex = l.items.indexOf(this.state.selection.primary);
    const newIndex = l.items.indexOf(uid);

    this.state.selection.additional = {};
    for (let i = Math.min(primaryIndex, newIndex); i <= Math.max(primaryIndex, newIndex); ++i) {
      if (i === primaryIndex) {
        continue;
      }
      Vue.set(this.state.selection.additional, l.items[i], true);
    }

    this.state.selection.lastTouched = uid;
  }

  public moveWithinCurrentList(uids: ReadonlyArray<string>, destIndex: number) {
    const uidsSet = new Set(uids);
    const l = this.currentList();
    const orderedUids: string[] = l.items.filter(i => uidsSet.has(i));

    destIndex = Math.min(destIndex, l.items.length);
    const newItems: (string | undefined)[] = l.items.map(i => (uidsSet.has(i) ? undefined : i));
    newItems.splice(destIndex, 0, ...orderedUids);

    l.items = newItems.filter((i): i is string => i !== undefined);
  }

  private findIndexInDirection(curIndex: number, columnCount: number, length: number, direction: Direction): number | undefined {
    if (direction === Direction.RIGHT) {
      if (curIndex < length) {
        return curIndex + 1;
      }
    } else if (direction === Direction.LEFT) {
      if (curIndex > 0) {
        return curIndex - 1;
      }
    } else if (direction == Direction.DOWN) {
      return Math.min(curIndex + columnCount, length - 1);
    } else if (direction == Direction.UP) {
      return Math.max(curIndex - columnCount, 0);
    }

    return undefined;
  }


  public movePrimarySelection(direction: Direction) {
    if (!this.state.selection.primary) {
      return;
    }

    const l = this.currentList();
    const curIndex = l.items.indexOf(this.state.selection.primary);
    const nextIndex = this.findIndexInDirection(curIndex, this.state.columnCount, l.items.length, direction);
    if (nextIndex !== undefined) {
      this.selectPrimary(l.items[nextIndex]);
    }
  }

  public moveAdditionalSelection(direction: Direction) {
    if (!this.state.selection.primary) {
      return;
    }

    const l = this.currentList();
    const primaryIndex = l.items.indexOf(this.state.selection.primary);
    const curIndex = l.items.indexOf(this.state.selection.lastTouched || this.state.selection.primary);
    const nextIndex = this.findIndexInDirection(curIndex, this.state.columnCount, l.items.length, direction);
    if (nextIndex === undefined) {
      return;
    }

    for (let i = Math.min(primaryIndex, curIndex, nextIndex); i <= Math.max(primaryIndex, curIndex, nextIndex); ++i) {
      if (i === primaryIndex) {
        continue;
      }

      if (nextIndex < primaryIndex) {
        if (i < nextIndex) {
          Vue.delete(this.state.selection.additional, l.items[i]);
        } else {
          Vue.set(this.state.selection.additional, l.items[i], true);
        }
      } else if (nextIndex > primaryIndex) {
        if (i > nextIndex) {
          Vue.delete(this.state.selection.additional, l.items[i]);
        } else {
          Vue.set(this.state.selection.additional, l.items[i], true);
        }
      } else {
        Vue.delete(this.state.selection.additional, l.items[i]);
      }
    }
    this.state.selection.lastTouched = l.items[nextIndex];
  }

  public numItemsMatchingFilter(filterSettings: FilterSettings): number {
    const invariant = filterSettingsInvariant(filterSettings);
    return Object.keys(this.state.lists[invariant]?.presenceMap ?? {}).length;
  }

  public labelSelection(label: Label) {
    if (!this.state.selection.primary) {
      return;
    }

    const invariant = filterSettingsInvariant({
      selectedLabels: [label],
      selectedStarRatings: [],
    });
    // Makes sure that the list for this label exists.
    this.listForFilterSettingsInvariant(invariant);

    for (let sel of Object.keys(this.state.selection.additional).concat(this.state.selection.primary)) {
      const prevLabel = this.state.metadata[sel].label;
      Vue.set(this.state.metadata[sel], 'label', label);

      if (prevLabel !== label) {
        this.ensureItemInCurrentList(sel);
        this.updateListsPresence(sel, invariant);
      }
    }
  }

  public updateColumnCount(n: number) {
    this.state.columnCount = n;
  }

  public changeLabelFilter(label: Label, state: boolean, allowMultiple: boolean) {
    const index = this.state.filterSettings.selectedLabels.indexOf(label);
    if (!state) {
      if (index !== -1) {
        this.state.filterSettings.selectedLabels.splice(index, 1);
      }
    } else {
      if (allowMultiple) {
        if (index === -1) {
          this.state.filterSettings.selectedLabels.push(label);
        }
      } else {
        this.state.filterSettings.selectedLabels = [label];
      }
    }

    this.state.filtersInvariant = filterSettingsInvariant(this.state.filterSettings);
    if (this.state.lists[this.state.filtersInvariant]) {
      this.syncListWithPresenceMap(this.state.filtersInvariant);
    } else {
      for (let uid in this.state.images) {
        this.ensureItemInCurrentList(uid);
      }
    }
    this.selectPrimary(undefined);
  }

  private isMatchingFilterSettings(mdata: ImageMetadata): boolean {
    const fs = this.state.filterSettings;
    const matchesLabel = ((fs.selectedLabels.length === 0) || fs.selectedLabels.indexOf(mdata.label) !== -1);
    const matchesStarRating = ((fs.selectedStarRatings.length === 0) || fs.selectedStarRatings.indexOf(mdata.starRating) !== -1);

    return matchesLabel && matchesStarRating;
  }

  private syncListWithPresenceMap(invariant: string) {
    const l = this.listForFilterSettingsInvariant(invariant);
    const pmCopy = { ...l.presenceMap };
    const newList = l.items.map(i => {
      if (pmCopy[i]) {
        delete pmCopy[i];
        return i;
      } else {
        return undefined;
      }
    }).filter((i): i is string => i !== undefined);
    for (const added of Object.keys(pmCopy)) {
      newList.push(added);
    }
    l.items = newList;
  }

  private updateListsPresence(uid: string, invariant: string) {
    for (let key in this.state.lists) {
      const l = this.state.lists[key];
      if (key === '' || key.includes(invariant)) {
        if (!l.presenceMap[uid]) {
          Vue.set(l.presenceMap, uid, true);
        }
      } else {
        if (l.presenceMap[uid]) {
          Vue.delete(l.presenceMap, uid);
        }
      }
    }
  }

  private ensureItemInCurrentList(uid: string) {
    const mdata = this.state.metadata[uid];

    const l = this.listForFilterSettingsInvariant(this.state.filtersInvariant);
    if (this.isMatchingFilterSettings(mdata)) {
      if (!l.presenceMap[uid]) {
        Vue.set(l.presenceMap, uid, true);
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

  private registerImage(imageFile: ImageFile) {
    Vue.set(this.state.images, imageFile.uid, imageFile);

    const imageMetadata: ImageMetadata = {
      label: Label.NONE,
      starRating: 0,
    };
    Vue.set(this.state.metadata, imageFile.uid, imageMetadata);
    this.ensureItemInCurrentList(imageFile.uid);

    const invariant = filterSettingsInvariant({
      selectedLabels: [Label.NONE],
      selectedStarRatings: [],
    });
    // Makes sure that the list for label None exists.
    this.listForFilterSettingsInvariant(invariant);

    this.updateListsPresence(imageFile.uid, invariant);
  }

  private registerImages(imageFile: ImageFile[]) {
    for (let im of imageFile) {
      this.registerImage(im);
    }
  }
}

export const STORE = new Store();
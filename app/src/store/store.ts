import { ApiService } from '@/backend/api';
import { Action, FileRegisteredAction } from '@/backend/actions';
import { FilterSettings, ImageFile, ImageList, ImageMetadata, Label, Rating, Rotation, ReadonlyState, State, ThumbnailRatio } from '@/store/schema';
import { bufferTime, catchError, filter, map } from 'rxjs/operators';
import Vue from 'vue';
import { TransientStore } from './transient-store';
import { Direction, selectRange, selectPrimary, movePrimarySelection, moveAdditionalSelection, toggleAdditionalSelection } from './helpers/selection';
import { reactive } from '@vue/composition-api';

export { Direction } from './helpers/selection';


function filterSettingsInvariant(fs: FilterSettings): string {
  const l = [...fs.selectedLabels];
  l.sort();

  const s = [...fs.selectedRatings];
  s.sort();

  const p = [...fs.selectedPaths];
  p.sort();

  const invariant = l.map(i => `label:${i}`)
    .concat(s.map(i => `rating:${i}`))
    .concat(p.map(i => `path:${encodeURIComponent(i)}`))
    .join('|');
  if (invariant) {
    return `|${invariant}|`;
  } else {
    return '';
  }
}

function invariantKey(invariant: string): string {
  const components = invariant.split(':');
  if (components.length !== 2) {
    throw new Error('invariantKey requires an invariant of length 1, got: ' + invariant);
  }

  return components[0].slice(1); // account for the starting '|'
}

function dirName(path: string): string {
  const pathComponents = path.split('/');
  return pathComponents.slice(0, pathComponents.length - 1).join('/');
}

export class Store {
  private _state: State = reactive({
    version: 1,

    filterSettings: {
      selectedLabels: [],
      selectedRatings: [],
      selectedPaths: [],
    },
    filtersInvariant: '',

    thumbnailSettings: {
      ratio: ThumbnailRatio.RATIO_4x3,
      size: 200,
    },
    selection: {
      primary: undefined,
      lastTouched: undefined,
      additional: {},
    },

    images: {},
    metadata: {},
    lists: {},
    paths: {},
  });

  constructor(
    private readonly transientStore: TransientStore,
    private readonly apiService: ApiService) { }

  get state(): ReadonlyState {
    return this._state;
  }

  replaceState(s: State) {
    this._state = reactive(s);
  }

  readonly registerImage$ = this.apiService.ws.pipe(
    filter((v) => {
      return (v as Action).action === 'FILE_REGISTERED' || (v as Action).action === 'THUMBNAIL_UPDATED';
    }),
    // TODO: buffer only on high throughput (implement cutsom operator).
    // See https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457?gi=5406b4c675c2
    bufferTime(500),
    map((vList) => {
      const aList = vList as FileRegisteredAction[];
      this.registerImages(aList.map(a => a.image));
    }),
    catchError((err, caught) => {  // defensive approach
      console.log('Error: ', err);
      return caught;
    }),
  ).subscribe();

  public currentList(): ImageList {
    return this.listForFilterSettingsInvariant(this._state.filtersInvariant);
  }

  public listForFilterSettingsInvariant(invariant: string): ImageList {
    let list = this._state.lists[invariant];
    if (list === undefined) {
      list = {
        presenceMap: {},
        items: [],
      };
      Vue.set(this._state.lists, invariant, list);
    }
    return list;
  }

  public selectPrimary(uid?: string) {
    selectPrimary(this._state.selection, uid);
  }

  public setThumbnailSize(size: number) {
    this._state.thumbnailSettings.size = size;
  }

  public toggleAdditionalSelection(uid: string) {
    toggleAdditionalSelection(this._state.selection, uid);
  }

  public selectRange(uid: string) {
    selectRange(this._state.selection, this.currentList(), uid);
  }

  public moveWithinCurrentList(uids: ReadonlyArray<string>, destIndex: number) {
    const uidsSet = new Set(uids);
    const l = this.currentList();
    const orderedUids: string[] = l.items.filter(i => uidsSet.has(i));
    console.log(['ordered uids', orderedUids]);

    destIndex = Math.min(destIndex, l.items.length);
    console.log(['dest index', destIndex]);
    const newItems: (string | undefined)[] = l.items.map(i => (uidsSet.has(i) ? undefined : i));
    newItems.splice(destIndex, 0, ...orderedUids);

    l.items = newItems.filter((i): i is string => i !== undefined);
  }


  public movePrimarySelection(direction: Direction) {
    movePrimarySelection(this._state.selection, this.currentList(), this.transientStore.state.columnCount, direction);
  }

  public moveAdditionalSelection(direction: Direction) {
    moveAdditionalSelection(this._state.selection, this.currentList(), this.transientStore.state.columnCount, direction);
  }

  public numItemsMatchingFilter(filterSettings: FilterSettings): number {
    const invariant = filterSettingsInvariant(filterSettings);
    return Object.keys(this._state.lists[invariant]?.presenceMap ?? {}).length;
  }

  public labelSelection(label: Label) {
    if (!this._state.selection.primary) {
      return;
    }

    const invariant = filterSettingsInvariant({
      selectedLabels: [label],
      selectedRatings: [],
      selectedPaths: [],
    });
    // Makes sure that the list for this label exists.
    this.listForFilterSettingsInvariant(invariant);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevLabel = this._state.metadata[sel].label;
      Vue.set(this._state.metadata[sel], 'label', label);

      if (prevLabel !== label) {
        this.ensureItemInCurrentList(sel);
        this.updateListsPresence(sel, invariant);
      }
    }
  }

  public changeLabelFilter(label: Label, state: boolean, allowMultiple: boolean) {
    if (!allowMultiple) {
      this._state.filterSettings.selectedRatings = [];
      this._state.filterSettings.selectedPaths = [];
    }

    const index = this._state.filterSettings.selectedLabels.indexOf(label);
    if (!state) {
      if (index !== -1) {
        this._state.filterSettings.selectedLabels.splice(index, 1);
      }
    } else {
      if (allowMultiple) {
        if (index === -1) {
          this._state.filterSettings.selectedLabels.push(label);
        }
      } else {
        this._state.filterSettings.selectedLabels = [label];
      }
    }

    this._state.filtersInvariant = filterSettingsInvariant(this._state.filterSettings);
    if (this._state.lists[this._state.filtersInvariant]) {
      this.syncListWithPresenceMap(this._state.filtersInvariant);
    } else {
      for (const uid in this._state.images) {
        this.ensureItemInCurrentList(uid);
      }
    }
    this.selectPrimary(undefined);
  }

  public rateSelection(rating: Rating) {
    console.log(['rate selection', rating]);
    if (!this._state.selection.primary) {
      return;
    }

    const invariant = filterSettingsInvariant({
      selectedLabels: [],
      selectedRatings: [rating],
      selectedPaths: [],
    });
    // Makes sure that the list for this label exists.
    this.listForFilterSettingsInvariant(invariant);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevRating = this._state.metadata[sel].rating;
      Vue.set(this._state.metadata[sel], 'rating', rating);

      if (prevRating !== rating) {
        this.ensureItemInCurrentList(sel);
        this.updateListsPresence(sel, invariant);
      }
    }
  }

  public changeRatingFilter(rating: Rating, state: boolean, allowMultiple: boolean) {
    console.log(['change label filter', rating, state, allowMultiple]);
    if (!allowMultiple) {
      this._state.filterSettings.selectedLabels = [];
      this._state.filterSettings.selectedPaths = [];
    }

    const index = this._state.filterSettings.selectedRatings.indexOf(rating);
    if (!state) {
      if (index !== -1) {
        this._state.filterSettings.selectedRatings.splice(index, 1);
      }
    } else {
      if (allowMultiple) {
        if (index === -1) {
          this._state.filterSettings.selectedRatings.push(rating);
        }
      } else {
        this._state.filterSettings.selectedRatings = [rating];
      }
    }

    this._state.filtersInvariant = filterSettingsInvariant(this._state.filterSettings);
    if (this._state.lists[this._state.filtersInvariant]) {
      this.syncListWithPresenceMap(this._state.filtersInvariant);
    } else {
      for (const uid in this._state.images) {
        this.ensureItemInCurrentList(uid);
      }
    }
    this.selectPrimary(undefined);
  }

  public changePathFilter(path: string, state: boolean, allowMultiple: boolean) {
    console.log(['change path filter', path, state, allowMultiple]);
    if (!allowMultiple) {
      this._state.filterSettings.selectedLabels = [];
      this._state.filterSettings.selectedRatings = [];
    }

    const index = this._state.filterSettings.selectedPaths.indexOf(path);
    if (!state) {
      if (index !== -1) {
        this._state.filterSettings.selectedPaths.splice(index, 1);
      }
    } else {
      if (allowMultiple) {
        if (index === -1) {
          this._state.filterSettings.selectedPaths.push(path);
        }
      } else {
        this._state.filterSettings.selectedPaths = [path];
      }
    }

    this._state.filtersInvariant = filterSettingsInvariant(this._state.filterSettings);
    if (this._state.lists[this._state.filtersInvariant]) {
      this.syncListWithPresenceMap(this._state.filtersInvariant);
    } else {
      for (const uid in this._state.images) {
        this.ensureItemInCurrentList(uid);
      }
    }
    this.selectPrimary(undefined);
  }

  private readonly leftRotationMap = {
    [Rotation.NONE]: Rotation.DEG_270,
    [Rotation.DEG_90]: Rotation.NONE,
    [Rotation.DEG_180]: Rotation.DEG_90,
    [Rotation.DEG_270]: Rotation.DEG_180,
  };

  public rotateLeft() {
    for (const mdata of this.allSelectedMetadata()) {
      mdata.adjustments.rotation = this.leftRotationMap[mdata.adjustments.rotation];
    }
  }

  private readonly rightRotationMap = {
    [Rotation.NONE]: Rotation.DEG_90,
    [Rotation.DEG_90]: Rotation.DEG_180,
    [Rotation.DEG_180]: Rotation.DEG_270,
    [Rotation.DEG_270]: Rotation.NONE,
  };

  public rotateRight() {
    for (const mdata of this.allSelectedMetadata()) {
      mdata.adjustments.rotation = this.rightRotationMap[mdata.adjustments.rotation];
    }
  }

  public flipHorizontally() {
    for (const mdata of this.allSelectedMetadata()) {
      mdata.adjustments.horizontalFlip = !mdata.adjustments.horizontalFlip;
    }
  }

  public flipVertically() {
    for (const mdata of this.allSelectedMetadata()) {
      mdata.adjustments.verticalFlip = !mdata.adjustments.verticalFlip;
    }
  }

  private * allSelectedMetadata(): IterableIterator<ImageMetadata> {
    if (this._state.selection.primary) {
      yield this._state.metadata[this._state.selection.primary];
    }

    for (const sel of Object.keys(this._state.selection.additional)) {
      yield this._state.metadata[sel];
    }
  }

  private isMatchingFilterSettings(image: ImageFile, mdata: ImageMetadata): boolean {
    const fs = this._state.filterSettings;
    const matchesLabel = ((fs.selectedLabels.length === 0) || fs.selectedLabels.indexOf(mdata.label) !== -1);
    const matchesStarRating = ((fs.selectedRatings.length === 0) || fs.selectedRatings.indexOf(mdata.rating) !== -1);
    const matchedPaths = ((fs.selectedPaths.length === 0) || fs.selectedPaths.indexOf(dirName(image.path)) !== -1);

    return matchesLabel && matchesStarRating && matchedPaths;
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
    for (const key in this._state.lists) {
      const l = this._state.lists[key];
      if (key === '' || key.includes(invariant)) {
        if (!l.presenceMap[uid]) {
          Vue.set(l.presenceMap, uid, true);
        }
      } else if (key.includes(invariantKey(invariant))) {  // This should only apply to lists in the same group (i.e. other labels, or other ratings, or other paths).        
        if (l.presenceMap[uid]) {
          Vue.delete(l.presenceMap, uid);
        }
      }
    }
  }

  private ensureItemInCurrentList(uid: string) {
    const image = this._state.images[uid]
    const mdata = this._state.metadata[uid];

    const l = this.listForFilterSettingsInvariant(this._state.filtersInvariant);
    if (this.isMatchingFilterSettings(image, mdata)) {
      if (!l.presenceMap[uid]) {
        Vue.set(l.presenceMap, uid, true);
        l.items.push(uid);
      }
    } else {
      if (l.presenceMap[uid]) {
        Vue.delete(l.presenceMap, uid);
        l.items.splice(l.items.indexOf(uid), 1);
      }
      if (this._state.selection.primary === uid) {
        this.selectPrimary(undefined);
      }
    }
  }

  private registerImage(imageFile: ImageFile) {
    const existed = this._state.images[imageFile.uid];
    Vue.set(this._state.images, imageFile.uid, imageFile);

    const dname = dirName(imageFile.path);
    Vue.set(this.state.paths, dname, true);

    let invariant: string;
    if (!existed) {
      const imageMetadata: ImageMetadata = {
        label: Label.NONE,
        rating: 0,
        adjustments: {
          rotation: Rotation.NONE,
          horizontalFlip: false,
          verticalFlip: false,
        },
      };
      Vue.set(this._state.metadata, imageFile.uid, imageMetadata);
      this.ensureItemInCurrentList(imageFile.uid);

      invariant = filterSettingsInvariant({
        selectedLabels: [Label.NONE],
        selectedRatings: [],
        selectedPaths: [],
      });
      // Makes sure that the list for label None exists.
      this.listForFilterSettingsInvariant(invariant);

      this.updateListsPresence(imageFile.uid, invariant);

      // Now update the ratings list.
      invariant = filterSettingsInvariant({
        selectedLabels: [],
        selectedRatings: [0],
        selectedPaths: [],
      });
      // Makes sure that the list for label None exists.
      this.listForFilterSettingsInvariant(invariant);

      this.updateListsPresence(imageFile.uid, invariant);
    } else {
      // Update the current list.
      this.ensureItemInCurrentList(imageFile.uid);
    }

    // Now update the paths.
    invariant = filterSettingsInvariant({
      selectedLabels: [],
      selectedRatings: [],
      selectedPaths: [dirName(imageFile.path)],
    });
    // Makes sure that the list for label None exists.
    this.listForFilterSettingsInvariant(invariant);

    this.updateListsPresence(imageFile.uid, invariant);
  }

  private registerImages(imageFile: ImageFile[]) {
    for (const im of imageFile) {
      this.registerImage(im);
    }
  }
}
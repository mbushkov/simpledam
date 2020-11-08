import { ApiService } from '@/backend/api';
import { Action, FileRegisteredAction } from '@/backend/actions';
import { FilterSettings, ImageFile, ImageList, ImageMetadata, Label, Rating, Rotation, ReadonlyState, State, ThumbnailRatio } from '@/store/schema';
import { bufferTime, catchError, filter, map } from 'rxjs/operators';
import Vue from 'vue';
import { TransientStore } from './transient-store';
import { Direction, selectRange, selectPrimary, movePrimarySelection, moveAdditionalSelection, toggleAdditionalSelection, selectPrimaryPreservingAdditionalIfPossible } from './helpers/selection';
import { reactive } from '@vue/composition-api';
import { filterSettingsInvariant, listForFilterSettingsInvariant, updateItemInList, updateListsPresence, updateListsWithFilter } from './helpers/filtering';
import { dirName } from './helpers/filesystem';

export { Direction } from './helpers/selection';


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
    return listForFilterSettingsInvariant(this._state.lists, this._state.filtersInvariant);
  }

  public selectPrimary(uid?: string) {
    selectPrimary(this._state.selection, uid);
  }

  public selectPrimaryPreservingAdditionalIfPossible(uid: string) {
    selectPrimaryPreservingAdditionalIfPossible(this._state.selection, uid);
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
    listForFilterSettingsInvariant(this._state.lists, invariant);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevLabel = this._state.metadata[sel].label;
      Vue.set(this._state.metadata[sel], 'label', label);

      if (prevLabel !== label) {
        this.updateItemInCurrentList(sel);
        updateListsPresence(this._state.lists, sel, invariant);
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
    updateListsWithFilter(this._state.filterSettings, this._state.lists, this._state.images, this._state.metadata);
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
    listForFilterSettingsInvariant(this._state.lists, invariant);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevRating = this._state.metadata[sel].rating;
      Vue.set(this._state.metadata[sel], 'rating', rating);

      if (prevRating !== rating) {
        this.updateItemInCurrentList(sel);
        updateListsPresence(this._state.lists, sel, invariant);
      }
    }
  }

  public changeRatingFilter(rating: Rating, state: boolean, allowMultiple: boolean) {
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
    updateListsWithFilter(this._state.filterSettings, this._state.lists, this._state.images, this._state.metadata);
    this.selectPrimary(undefined);
  }

  public changePathFilter(path: string, state: boolean, allowMultiple: boolean) {
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

    updateListsWithFilter(this._state.filterSettings, this._state.lists, this._state.images, this._state.metadata);
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

  public rotateToDefault() {
    for (const mdata of this.allSelectedMetadata()) {
      mdata.adjustments.rotation = Rotation.NONE;
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

  private updateItemInCurrentList(uid: string) {
    const image = this._state.images[uid]
    const mdata = this._state.metadata[uid];

    const l = listForFilterSettingsInvariant(this._state.lists, this._state.filtersInvariant);
    if (!updateItemInList(l, this._state.filterSettings, image, mdata)) {
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
      this.updateItemInCurrentList(imageFile.uid);

      invariant = filterSettingsInvariant({
        selectedLabels: [Label.NONE],
        selectedRatings: [],
        selectedPaths: [],
      });
      // Makes sure that the list for label None exists.
      listForFilterSettingsInvariant(this._state.lists, invariant);

      updateListsPresence(this._state.lists, imageFile.uid, invariant);

      // Now update the ratings list.
      invariant = filterSettingsInvariant({
        selectedLabels: [],
        selectedRatings: [0],
        selectedPaths: [],
      });
      // Makes sure that the list for label None exists.
      listForFilterSettingsInvariant(this._state.lists, invariant);

      updateListsPresence(this._state.lists, imageFile.uid, invariant);
    } else {
      // Update the current list.
      this.updateItemInCurrentList(imageFile.uid);
    }

    // Now update the paths.
    invariant = filterSettingsInvariant({
      selectedLabels: [],
      selectedRatings: [],
      selectedPaths: [dirName(imageFile.path)],
    });
    // Makes sure that the list for label None exists.
    listForFilterSettingsInvariant(this._state.lists, invariant);

    updateListsPresence(this._state.lists, imageFile.uid, invariant);
  }

  private registerImages(imageFile: ImageFile[]) {
    for (const im of imageFile) {
      this.registerImage(im);
    }
  }
}
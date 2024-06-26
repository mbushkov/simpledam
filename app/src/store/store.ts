import { type Action, type FileRegisteredAction } from '@/backend/actions';
import { ApiService } from '@/backend/api';
import { Label, Rotation, ThumbnailRatio, type FilterSettings, type ImageFile, type ImageList, type ImageMetadata, type ListColumnName, type Rating, type ReadonlyState, type State } from '@/store/schema';
import moment from 'moment';
import { bufferTime, catchError, filter, map } from 'rxjs/operators';
import { reactive } from 'vue';
import { dirName } from './helpers/filesystem';
import { filterSettingsInvariant, listForFilterSettingsInvariant, updateItemInList, updateListsPresence, updateListsWithFilter } from './helpers/filtering';
import { Direction, moveAdditionalSelection, movePrimarySelection, selectAll, selectPrimary, selectPrimaryPreservingAdditionalIfPossible, selectRange, toggleAdditionalSelection } from './helpers/selection';
import { TransientStore } from './transient-store';

export { Direction } from './helpers/selection';

export enum SortAttribute {
  FILE_NAME,
  ORIGIN_TIME,
  FILE_CREATION_TIME,
};

export enum SortOrder {
  ASC,
  DESC,
};

function _initialState(): State {
  return {
    version: 3,

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
    listSettings: {
      columns: [
        {
          name: 'preview',
          width: 60,
        },
        {
          name: 'fileName',
          width: 200,
        },
        {
          name: 'label',
          width: 40,
        },
        {
          name: 'rating',
          width: 120,
        },
        {
          name: 'width',
          width: 60,
        },
        {
          name: 'height',
          width: 60,
        },
        {
          name: 'filePath',
          width: 100,
          grow: true,
        },
      ],
      rowHeight: 40,
    },
    selection: {
      primary: undefined,
      lastPrimaryIndex: 0,
      lastTouched: undefined,
      lastTouchedIndex: 0,
      additional: {},
    },

    images: {},
    metadata: {},
    lists: {
      // This would be created automatically anyway. But having this here allows for easy changes detection when checking if we need to show an "unsaved changes" dialog.
      '': {
        presenceMap: {},
        items: [],
      }
    },
    paths: {},
  };
}

export function initialState(): ReadonlyState { return _initialState(); }

export class Store {
  private _state: State = reactive({
    ..._initialState(),
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

  public selectAll() {
    selectAll(this._state.selection, this.currentList());
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

    const currentList = this.currentList();
    const primaryIndex = currentList.items.indexOf(this._state.selection.primary);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevLabel = this._state.metadata[sel].label;
      this._state.metadata[sel]['label'] = label;

      if (prevLabel !== label) {
        this.updateItemInCurrentList(sel);
        updateListsPresence(this._state.lists, sel, invariant);
      }
    }

    if (currentList.items.length === 0) {
      this.selectPrimary(undefined);
    } else {
      this.selectPrimary(currentList.items[Math.min(primaryIndex, currentList.items.length - 1)]);
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

    const currentList = this.currentList();
    const primaryIndex = currentList.items.indexOf(this._state.selection.primary);

    for (const sel of Object.keys(this._state.selection.additional).concat(this._state.selection.primary)) {
      const prevRating = this._state.metadata[sel].rating;
      this._state.metadata[sel]['rating'] = rating;

      if (prevRating !== rating) {
        this.updateItemInCurrentList(sel);
        updateListsPresence(this._state.lists, sel, invariant);
      }
    }

    if (currentList.items.length === 0) {
      this.selectPrimary(undefined);
    } else {
      this.selectPrimary(currentList.items[Math.min(primaryIndex, currentList.items.length - 1)]);
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

    this._state.filtersInvariant = filterSettingsInvariant(this._state.filterSettings);
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

  public removeListColumn(index: number) {
    const isLast = this._state.listSettings.columns.length === index + 1;
    this._state.listSettings.columns.splice(index, 1);
    if (isLast) {
      this._state.listSettings.columns[this._state.listSettings.columns.length - 1].grow = true;
    }
  }

  public addListColumn(index: number, columnName: ListColumnName) {
    this._state.listSettings.columns.splice(index, 0, {
      name: columnName,
      width: 50,
    });
    for (const c of this._state.listSettings.columns) {
      c.grow = false;
    }
    this._state.listSettings.columns[this._state.listSettings.columns.length - 1].grow = true;
  }

  public sort(attr: SortAttribute, order: SortOrder) {
    const l = this.currentList();
    let comparator: (a: ImageFile, b: ImageFile) => number;
    switch (attr) {
      case SortAttribute.FILE_NAME:
        comparator = (a, b) => {
          return a.path.localeCompare(b.path);
        };
        break;
      case SortAttribute.ORIGIN_TIME:
        comparator = (a, b) => {
          let am: moment.Moment;
          let bm: moment.Moment;
          if (a.exif_data?.date_time_original) {
            am = moment(a.exif_data.date_time_original, 'YYYY:MM:DD HH:mm:ss')
            if (!am.isValid()) {
              am = moment(a.file_ctime);
            }
          } else {
            am = moment(a.file_ctime);
          }
          if (b.exif_data?.date_time_original) {
            bm = moment(b.exif_data.date_time_original, 'YYYY:MM:DD HH:mm:ss')
            if (!bm.isValid()) {
              bm = moment(b.file_ctime);
            }
          } else {
            bm = moment(b.file_ctime);
          }

          return am.diff(bm, 'millisecond');
        };
        break;
      case SortAttribute.FILE_CREATION_TIME:
        comparator = (a, b) => {
          return a.file_ctime - b.file_ctime;
        };
        break;
      default:
        throw new Error('Unknown sort attribute');
    }

    if (order === SortOrder.DESC) {
      const ascComparator = comparator;
      comparator = (a, b) => -ascComparator(a, b);
    }

    l.items.sort((a, b) => {
      return comparator(this._state.images[a], this._state.images[b]);
    });
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
    this._state.images[imageFile.uid] = imageFile;

    const dname = dirName(imageFile.path);
    this._state.paths[dname] = true;

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
      this._state.metadata[imageFile.uid] = imageMetadata;
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
import { Immutable } from '@/lib/type-utils';
import { reactive } from '@vue/composition-api';

export enum ImageViewerTab {
  THUMBNAILS = 0,
  MEDIA = 1,
}

export interface TransientState {
  imageViewerTab: ImageViewerTab;
  columnCount: number,
  leftPaneWidth: number;
}

type ReadonlyTransientState = Immutable<TransientState>;

export class TransientStore {
  private _state: TransientState = reactive({
    imageViewerTab: ImageViewerTab.THUMBNAILS,
    columnCount: 1,
    leftPaneWidth: 1,
  })

  get state(): ReadonlyTransientState {
    return this._state;
  }

  setImageViewerTab(tab: ImageViewerTab) {
    this._state.imageViewerTab = tab;
  }

  setColumnCount(n: number) {
    this._state.columnCount = n;
  }

  setLeftPaneWidth(n: number) {
    this._state.leftPaneWidth = n;
  }
}

import Vue from 'vue';
import { Immutable } from './type-utils';

export enum ImageViewerTab {
  THUMBNAILS = 0,
  MEDIA = 1,
}

export interface SingleImageSettings {
  autoFit: boolean;
  scale: number;
}

export interface TransientState {
  imageViewerTab: ImageViewerTab;
  columnCount: number,
  singleImageSettings: SingleImageSettings;
}

type ReadonlyTransientState = Immutable<TransientState>;

class TransientStore {
  private _state: TransientState = Vue.observable({
    imageViewerTab: ImageViewerTab.THUMBNAILS,
    columnCount: 1,
    singleImageSettings: {
      autoFit: true,
      scale: 100,
    },
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
}

export const TRANSIENT_STORE = new TransientStore();
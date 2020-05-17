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

export enum ThumbnailRatio {
  NORMAL = 1,
  RATIO_4x3 = 4 / 3,
  RATIO_3x4 = 3 / 4,
}

export interface ThumbnailSettings {
  ratio: ThumbnailRatio;
  size: number;
}

export interface TransientState {
  imageViewerTab: ImageViewerTab;
  singleImageSettings: SingleImageSettings;
  thumbnailSettings: ThumbnailSettings;
}

type ReadonlyTransientState = Immutable<TransientState>;

class TransientStore {
  private _state: TransientState = Vue.observable({
    imageViewerTab: ImageViewerTab.THUMBNAILS,
    singleImageSettings: {
      autoFit: true,
      scale: 100,
    },
    thumbnailSettings: {
      ratio: ThumbnailRatio.RATIO_4x3,
      size: 80,
    },
  })

  get state(): ReadonlyTransientState {
    return this._state;
  }

  setImageViewerTab(tab: ImageViewerTab) {
    this._state.imageViewerTab = tab;
  }
}

export const TRANSIENT_STORE = new TransientStore();
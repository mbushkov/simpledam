
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

export enum Rotation {
  NONE = 0,
  DEG_90 = 90,
  DEG_180 = 180,
  DEG_270 = 270,
}

export declare interface ImageAdjustments {
  rotation: Rotation;
  horizontalFlip: boolean;
  verticalFlip: boolean;
}

export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

export declare interface ImageMetadata {
  rating: Rating;
  label: Label;

  adjustments: ImageAdjustments;
}

export declare interface ImageList {
  presenceMap: { [key: string]: boolean };
  items: string[];
}

export declare interface FilterSettings {
  selectedLabels: Label[];
  selectedRatings: Rating[];
  selectedPaths: string[];
}


export declare interface Selection {
  primary: string | undefined;
  lastTouched: string | undefined;
  additional: { [key: string]: boolean };
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

export declare interface State {
  version: 1;

  filterSettings: FilterSettings;
  filtersInvariant: string;

  thumbnailSettings: ThumbnailSettings;
  selection: Selection;

  images: { [key: string]: ImageFile };
  metadata: { [key: string]: ImageMetadata };
  lists: { [key: string]: ImageList };
  paths: { [key: string]: string };
}
export type ImageUid = string;

export declare interface Size {
  width: number;
  height: number;
}

export declare interface ImageFilePreview {
  preview_size: Size;
  preview_timestamp: number;
}

export declare interface ExifData {
  // See https://www.media.mit.edu/pia/Research/deepview/exif.html

  // Tags used by IFD0 (main image)
  make?: string;
  model?: string;
  orientation?: number;
  x_resolution?: number;
  y_resolution?: number;
  resolution_unit?: number;
  software?: string;
  datetime?: string;
  exposure_time?: number;
  f_number?: number;

  // Tags used by Exif SubIFD
  exposure_program?: number;
  iso_speed_ratings?: number;
  exif_version?: string;
  datetime_original?: string;
  datetime_digitized?: string;
  shutter_speed_value?: number;
  aperture_value?: number;
  brightness_value?: number;
  exposure_bias_value?: number;
  max_aperture_value?: number;
  subject_distance?: number;
  metering_mode?: number;
  light_source?: number;
  flash?: number;
  focal_length?: number;
  exif_image_width?: number;
  exif_image_height?: number;
  focal_plane_x_resolution?: number;
  focal_plane_y_resolution?: number;

  // Tags used by IFD1 (thumbnail image)
  image_width?: number;
  image_height?: number;
  bits_per_sample?: number;
  compression?: number;
  photometric_interprretation?: number;
}


export enum FileColorTag {
  NONE,
  GRAY,
  GREEN,
  PURPLE,
  BLUE,
  YELLOW,
  RED,
  ORANGE,
}


export declare interface ImageFile {
  path: string;
  uid: ImageUid;

  size: Size;
  previews: ImageFilePreview[];

  file_size: number;
  file_ctime: number;
  file_mtime: number;
  file_color_tag: FileColorTag;

  exif_data?: ExifData;
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
  presenceMap: { [key: ImageUid]: boolean };
  items: ImageUid[];
}

export declare interface FilterSettings {
  selectedLabels: Label[];
  selectedRatings: Rating[];
  selectedPaths: string[];
}


export declare interface Selection {
  primary: ImageUid | undefined;
  lastPrimaryIndex: number;
  lastTouched: ImageUid | undefined;
  lastTouchedIndex: number;
  additional: { [key: ImageUid]: boolean };
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
  version: 2;

  filterSettings: FilterSettings;
  filtersInvariant: string;

  thumbnailSettings: ThumbnailSettings;
  selection: Selection;

  images: { [key: string]: ImageFile };
  metadata: { [key: string]: ImageMetadata };
  lists: { [key: string]: ImageList };
  paths: { [key: string]: boolean };
}
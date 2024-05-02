export declare type ImageUid = string;

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
  date_time?: string;
  exposure_time?: number;
  f_number?: number;

  // Tags used by Exif SubIFD
  exposure_program?: number;
  iso_speed_ratings?: number;
  exif_version?: string;
  date_time_original?: string;
  date_time_digitized?: string;
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

  // GPS Info
  gps_version_id?: string;
  gps_latitude_ref?: string;
  gpa_latitude?: string[];
  gps_longitude_ref?: string;
  gps_longitude?: string[];
  gps_altitude_ref?: number;
  gps_altitude?: string;
  gps_time_stamp?: string[];
  gps_date_stamp?: number;
}

export declare enum FileColorTag {
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

  icc_profile_description: string;
  mime_type: string;
  exif_data: ExifData;

  country: string;
  city: string;
}

export declare enum Label {
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

export declare enum Rotation {
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

export declare type Rating = 0 | 1 | 2 | 3 | 4 | 5;

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

export declare enum ThumbnailRatio {
  NORMAL = 1,
  RATIO_4x3 = 4 / 3,
  RATIO_3x4 = 3 / 4,
}

export declare interface ThumbnailSettings {
  ratio: ThumbnailRatio;
  size: number;
}

export declare enum InferredAttributeType {
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  RATIONAL = 'RATIONAL',
  STRING = 'STRING',
  DATE_TIME = 'DATE_TIME',
}

export declare interface InferredAttributeBase {
  name: string;
  title: string
  type: InferredAttributeType;
}

export declare interface InferredIntegerAttribute extends InferredAttributeBase {
  type: InferredAttributeType.INTEGER;
  value?: number;
}

export declare interface InferredFloatAttribute extends InferredAttributeBase {
  type: InferredAttributeType.FLOAT;
  value?: number;
}

export declare interface InferredRationalAttribute extends InferredAttributeBase {
  type: InferredAttributeType.RATIONAL;
  value?: [number, number];
}


export declare interface InferredStringAttribute extends InferredAttributeBase {
  type: InferredAttributeType.STRING;
  value?: string;
}

export declare interface InferredDateTimeAttribute extends InferredAttributeBase {
  type: InferredAttributeType.DATE_TIME;
  value?: string;  // "2014-09-08T08:02:17-05:00" (ISO 8601, no fractional seconds)
}

export declare type InferredAttribute = InferredIntegerAttribute | InferredFloatAttribute | InferredRationalAttribute | InferredStringAttribute | InferredDateTimeAttribute;

export declare interface InferredAttributeGroup {
  name: string;
  title: string;
  attributes: InferredAttribute[];
}

export declare interface InferredImageMetadata {
  rating: Rating;
  label: Label;
  width: number,
  height: number,
  dpi: number,
  fileName: string;
  filePath: string;
  fileSize: number;
  fileCtime: number;
  fileMtime: number;
  fileColorTag: FileColorTag;
  iccProfileDescription: string;
  mimeType: string;
  author: string;
  originTime: number;
  captureDevice: string;
  country: string;
  city: string;
}

export declare type ListColumnName = "preview" | keyof InferredImageMetadata;

export declare interface ListColumn {
  name: ListColumnName;
  width: number;
  grow?: boolean;
}

export declare interface ListSettings {
  rowHeight: number;
  columns: ListColumn[];
}

export declare interface State {
  version: 3;

  filterSettings: FilterSettings;
  filtersInvariant: string;

  thumbnailSettings: ThumbnailSettings;
  listSettings: ListSettings,
  selection: Selection;

  images: { [key: string]: ImageFile };
  metadata: { [key: string]: ImageMetadata };
  lists: { [key: string]: ImageList };
  paths: { [key: string]: boolean };
}
import { Immutable } from '@/lib/type-utils';

import type { State } from './version_0003';
export { FileColorTag, InferredAttributeType, Label, Rotation, ThumbnailRatio } from './version_0003';
export type { ExifData, FilterSettings, ImageAdjustments, ImageFile, ImageFilePreview, ImageList, ImageMetadata, ImageUid, InferredAttribute, InferredAttributeBase, InferredAttributeGroup, InferredDateTimeAttribute, InferredFloatAttribute, InferredImageMetadata, InferredIntegerAttribute, InferredRationalAttribute, InferredStringAttribute, ListColumn, ListColumnName, ListSettings, Rating, Selection, Size, State, ThumbnailSettings } from './version_0003';

export type ReadonlyState = Immutable<State>;

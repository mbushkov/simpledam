import { ImageFile as OldImageFile, State as OldState } from '@/store/schema/version_0001';
import { FileColorTag, ImageFile as NewImageFile, State as NewState } from '@/store/schema/version_0002';

function convertImages(oldImages: { [key: string]: OldImageFile }): { [key: string]: NewImageFile } {
  const result: { [key: string]: NewImageFile } = {};

  for (const key in oldImages) {
    const o = oldImages[key];
    result[key] = {
      path: o.path,
      uid: o.uid,
      
      size: o.size,
      previews: [{
        preview_size: o.preview_size,
        preview_timestamp: o.preview_timestamp,
      }],

      file_ctime: 0,
      file_mtime: 0,
      file_size: 0,
      file_color_tag: FileColorTag.NONE,

      icc_profile_description: '',
      mime_type: '',
      exif_data: {},
    }
  }

  return result;
}

export default function Migrate(oldState: OldState): NewState {
  return {
    version: 2,

    filterSettings: oldState.filterSettings,
    filtersInvariant: oldState.filtersInvariant,

    thumbnailSettings: oldState.thumbnailSettings,
    selection: {
      ...oldState.selection,
      lastPrimaryIndex: 0,
      lastTouchedIndex: 0,
    },

    images: convertImages(oldState.images),
    metadata: oldState.metadata,
    lists: oldState.lists,
    paths: oldState.paths,
  }
}
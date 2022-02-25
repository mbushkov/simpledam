import { State as OldState, ImageFile as OldImageFile } from '@/store/schema/version_0001';
import { State as NewState, ImageFile as NewImageFile } from '@/store/schema/version_0002';

function convertImages(oldImages: { [key: string]: OldImageFile }): { [key: string]: NewImageFile } {
  const result: { [key: string]: NewImageFile } = {};

  for (const key in oldImages) {
    const o = oldImages[key];
    result[key] = {
      path: o.path,
      creation_timestamp: 0,
      modification_timestamp: 0,
      previews: [{
        preview_size: o.preview_size,
        preview_timestamp: o.preview_timestamp,
      }],
      size: o.size,
      uid: o.uid,
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
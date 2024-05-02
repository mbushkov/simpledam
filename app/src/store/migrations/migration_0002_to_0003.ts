import { type State as OldState } from '@/store/schema/version_0002';
import { type State as NewState } from '@/store/schema/version_0003';

function transformImages(images: OldState['images']): NewState['images'] {
  const result: NewState['images'] = {};
  for (const k in images) {
    const img = images[k];
    result[k] = {
      ...img,
      country: '',
      city: '',
    };
  }

  return result;
}

export default function Migrate(oldState: OldState): NewState {
  return {
    ...oldState,
    images: transformImages(oldState.images),
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
          name: 'fileSize',
          width: 100,
        },
        {
          name: 'filePath',
          width: 100,
          grow: true,
        },
      ],
      rowHeight: 40,
    },
    version: 3,
  }
}
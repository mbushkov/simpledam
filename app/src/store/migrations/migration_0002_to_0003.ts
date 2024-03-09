import { State as OldState } from '@/store/schema/version_0002';
import { State as NewState } from '@/store/schema/version_0003';

export default function Migrate(oldState: OldState): NewState {
  return {
    ...oldState,
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
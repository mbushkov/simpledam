import Vue from 'vue';
import { ImageList, Selection } from '@/store/schema';


export function selectRange(selection: Selection, currentList: ImageList, uid: string) {
  if (!selection.primary) {
    return;
  }

  const primaryIndex = currentList.items.indexOf(selection.primary);
  if (primaryIndex === -1) {
    throw new Error('Inconsistency: primary selection has to be in the current list.');
  }
  const newIndex = currentList.items.indexOf(uid);
  if (newIndex === -1) {
    throw new Error('Inconsistency: target selection has to be in the current list');
  }

  selection.additional = {};
  for (let i = Math.min(primaryIndex, newIndex); i <= Math.max(primaryIndex, newIndex); ++i) {
    if (i === primaryIndex) {
      continue;
    }
    Vue.set(selection.additional, currentList.items[i], true);
  }

  selection.lastTouched = uid;
}
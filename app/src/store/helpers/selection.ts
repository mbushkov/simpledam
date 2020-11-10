import Vue from 'vue';
import { ImageList, Selection } from '@/store/schema';

export enum Direction {
  UP,
  DOWN,
  RIGHT,
  LEFT,
}

function findIndexInDirection(curIndex: number, columnCount: number, length: number, direction: Direction): number | undefined {
  if (direction === Direction.RIGHT) {
    if (curIndex < length - 1) {
      return curIndex + 1;
    }
  } else if (direction === Direction.LEFT) {
    if (curIndex > 0) {
      return curIndex - 1;
    }
  } else if (direction == Direction.DOWN) {
    return Math.min(curIndex + columnCount, length - 1);
  } else if (direction == Direction.UP) {
    return Math.max(curIndex - columnCount, 0);
  }

  return undefined;
}

export function selectPrimary(selection: Selection, uid: string | undefined) {
  selection.lastTouched = uid;

  if (selection.primary !== uid) {
    selection.primary = uid;
    selection.additional = {};
  }
}

export function selectPrimaryPreservingAdditionalIfPossible(selection: Selection, uid: string) {
  if (selection.primary === uid) {
    return;
  } else if (selection.primary !== undefined && selection.additional[uid]) {
    selection.additional[selection.primary] = true;
    Vue.delete(selection.additional, uid);

    selection.primary = uid;
    selection.lastTouched = uid;
  } else {
    selectPrimary(selection, uid);
  }
}

export function toggleAdditionalSelection(selection: Selection, uid: string) {
  selection.lastTouched = uid;

  if (selection.primary === uid) {
    let newPrimary = undefined;
    const aKeys = Object.keys(selection.additional);
    if (aKeys.length > 0) {
      newPrimary = aKeys[0];
      Vue.delete(selection.additional, newPrimary);
    }
    selection.primary = newPrimary;
  } else {
    if (selection.primary === undefined) {
      selectPrimary(selection, uid);
      return;
    }

    if (selection.additional[uid]) {
      Vue.delete(selection.additional, uid);
    } else {
      Vue.set(selection.additional, uid, true);
    }
  }
}

export function movePrimarySelection(selection: Selection, currentList: ImageList, columnCount: number, direction: Direction) {
  if (!selection.primary) {
    return;
  }

  const curIndex = currentList.items.indexOf(selection.primary);
  const nextIndex = findIndexInDirection(curIndex, columnCount, currentList.items.length, direction);
  if (nextIndex !== undefined) {
    selectPrimary(selection, currentList.items[nextIndex]);
  }
}

export function moveAdditionalSelection(selection: Selection, currentList: ImageList, columnCount: number, direction: Direction) {
  if (!selection.primary) {
    return;
  }

  const primaryIndex = currentList.items.indexOf(selection.primary);
  const curIndex = currentList.items.indexOf(selection.lastTouched || selection.primary);
  const nextIndex = findIndexInDirection(curIndex, columnCount, currentList.items.length, direction);
  if (nextIndex === undefined) {
    return;
  }

  for (let i = Math.min(primaryIndex, curIndex, nextIndex); i <= Math.max(primaryIndex, curIndex, nextIndex); ++i) {
    if (i === primaryIndex) {
      continue;
    }

    if (nextIndex < primaryIndex) {
      if (i < nextIndex) {
        Vue.delete(selection.additional, currentList.items[i]);
      } else {
        Vue.set(selection.additional, currentList.items[i], true);
      }
    } else if (nextIndex > primaryIndex) {
      if (i > nextIndex) {
        Vue.delete(selection.additional, currentList.items[i]);
      } else {
        Vue.set(selection.additional, currentList.items[i], true);
      }
    } else {
      Vue.delete(selection.additional, currentList.items[i]);
    }
  }
  selection.lastTouched = currentList.items[nextIndex];
}

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

// TODO: test
export function selectAll(selection: Selection, currentList: ImageList) {
  if (selection.primary === undefined) {
    selectPrimary(selection, currentList.items[0]);
  }

  for (const uid of currentList.items) {
    if (uid !== selection.primary) {
      Vue.set(selection.additional, uid, true);
    }
  }
}
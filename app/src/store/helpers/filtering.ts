import Vue from 'vue';
import { FilterSettings, ImageFile, ImageList, ImageMetadata } from '../schema';
import { dirName } from './filesystem';

export function filterSettingsInvariant(fs: FilterSettings): string {
  const l = [...fs.selectedLabels];
  l.sort();

  const s = [...fs.selectedRatings];
  s.sort();

  const p = [...fs.selectedPaths];
  p.sort();

  const invariant = l.map(i => `label:${i}`)
    .concat(s.map(i => `rating:${i}`))
    .concat(p.map(i => `path:${encodeURIComponent(i)}`))
    .join('|');
  if (invariant) {
    return `|${invariant}|`;
  } else {
    return '';
  }
}

export function syncListWithPresenceMap(l: ImageList) {
  const pmCopy = { ...l.presenceMap };
  const newList = l.items.map(i => {
    if (pmCopy[i]) {
      delete pmCopy[i];
      return i;
    } else {
      return undefined;
    }
  }).filter((i): i is string => i !== undefined);
  for (const added of Object.keys(pmCopy)) {
    newList.push(added);
  }
  l.items = newList;
}

export function isMatchingFilterSettings(fs: FilterSettings, image: ImageFile, mdata: ImageMetadata): boolean {
  const matchesLabel = ((fs.selectedLabels.length === 0) || fs.selectedLabels.indexOf(mdata.label) !== -1);
  const matchesStarRating = ((fs.selectedRatings.length === 0) || fs.selectedRatings.indexOf(mdata.rating) !== -1);
  const matchedPaths = ((fs.selectedPaths.length === 0) || fs.selectedPaths.indexOf(dirName(image.path)) !== -1);

  return matchesLabel && matchesStarRating && matchedPaths;
}

export function listForFilterSettingsInvariant(lists: { [key: string]: ImageList }, invariant: string): ImageList {
  let list = lists[invariant];
  if (list === undefined) {
    list = {
      presenceMap: {},
      items: [],
    };
    Vue.set(lists, invariant, list);
  }
  return list;
}

export function updateItemInList(l: ImageList, fs: FilterSettings, image: ImageFile, mdata: ImageMetadata) {
  if (isMatchingFilterSettings(fs, image, mdata)) {
    if (!l.presenceMap[image.uid]) {
      Vue.set(l.presenceMap, image.uid, true);
      l.items.push(image.uid);
    }
  } else {
    if (l.presenceMap[image.uid]) {
      Vue.delete(l.presenceMap, image.uid);
      l.items.splice(l.items.indexOf(image.uid), 1);
    }
  }
}

export function updateListsWithFilter(filterSettings: FilterSettings,
  lists: { [key: string]: ImageList },
  images: { [key: string]: ImageFile },
  metadata: { [key: string]: ImageMetadata }) {

  const filtersInvariant = filterSettingsInvariant(filterSettings);
  if (lists[filtersInvariant]) {
    syncListWithPresenceMap(lists[filtersInvariant]);
  } else {
    const list = listForFilterSettingsInvariant(lists, filtersInvariant);
    for (const uid in images) {
      updateItemInList(list, filterSettings, images[uid], metadata[uid]);
    }
  }
}

import { createJSONWrapper, setupTestEnv } from "@/lib/test-utils";
import { expect } from 'chai';
import { FilterSettings, ImageFile, ImageList, ImageMetadata, Label } from '../schema';
import { filterSettingsInvariant, isMatchingFilterSettings, syncListWithPresenceMap, updateItemInList, updateListsWithFilter } from './filtering';

setupTestEnv();

function imageFile(f: Partial<ImageFile> = {}): ImageFile {
  return {
    path: '/foo/bar',
    preview_size: { width: 0, height: 0 },
    preview_timestamp: 0,
    size: { width: 0, height: 0 },
    uid: 'a',
    ...f
  };
}

function imageMetadata(m: Partial<ImageMetadata> = {}): ImageMetadata {
  return {
    adjustments: {
      horizontalFlip: false,
      rotation: 0,
      verticalFlip: false,
    },
    label: Label.NONE,
    rating: 0,
    ...m,
  };
}

function filterSettings(fs: Partial<FilterSettings> = {}): FilterSettings {
  return {
    selectedLabels: [],
    selectedPaths: [],
    selectedRatings: [],
    ...fs,
  };
}

describe('Store filtering helpers', () => {

  describe('fiterSettingsInvaraint()', () => {
    function filterSettings(settings: Partial<FilterSettings>): FilterSettings {
      return {
        selectedLabels: [],
        selectedPaths: [],
        selectedRatings: [],
        ...settings,
      };
    }

    it('produces empty invariant for empty settings', () => {
      expect(filterSettingsInvariant(filterSettings({
      }))).to.equal('');
    });

    it('produces correct invariant for single label', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedLabels: [Label.BLUE],
      }))).to.equal('|label:3|');
    });

    it('produces correct invariant for two labels', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedLabels: [Label.BLUE, Label.RED],
      }))).to.equal('|label:1|label:3|');
      // Check that the order is fixed.
      expect(filterSettingsInvariant(filterSettings({
        selectedLabels: [Label.RED, Label.BLUE],
      }))).to.equal('|label:1|label:3|');
    });

    it('produces correct invariant for single rating', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedRatings: [0],
      }))).to.equal('|rating:0|');
    });

    it('produces correct invariant for two ratings', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedRatings: [0, 1],
      }))).to.equal('|rating:0|rating:1|');
      // Check that the order is fixed.
      expect(filterSettingsInvariant(filterSettings({
        selectedRatings: [1, 0],
      }))).to.equal('|rating:0|rating:1|');
    });

    it('produces correct invariant for ratings and labels', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedLabels: [Label.BLUE, Label.RED],
        selectedRatings: [0, 1],
      }))).to.equal('|label:1|label:3|rating:0|rating:1|');
    });

    it('produces correct invariant for single path', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedPaths: ['/foo/bar'],
      }))).to.equal('|path:%2Ffoo%2Fbar|');
    });

    it('produces correct invariant for single path with unicode characters', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedPaths: ['/этот/путь'],
      }))).to.equal('|path:%2F%D1%8D%D1%82%D0%BE%D1%82%2F%D0%BF%D1%83%D1%82%D1%8C|');
    });

    it('produces correct invariant for two paths', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedPaths: ['/foo/bar', '/some/path'],
      }))).to.equal('|path:%2Ffoo%2Fbar|path:%2Fsome%2Fpath|');
      // Check that the order is fixed.
      expect(filterSettingsInvariant(filterSettings({
        selectedPaths: ['/some/path', '/foo/bar'],
      }))).to.equal('|path:%2Ffoo%2Fbar|path:%2Fsome%2Fpath|');
    });

    it('produces correct invariants for labels, ratings and paths', () => {
      expect(filterSettingsInvariant(filterSettings({
        selectedLabels: [Label.BLUE, Label.RED],
        selectedRatings: [0, 1],
        selectedPaths: ['/foo/bar', '/some/path'],
      }))).to.equal('|label:1|label:3|rating:0|rating:1|path:%2Ffoo%2Fbar|path:%2Fsome%2Fpath|');
    });
  });

  describe('syncListWithPresenceMap()', () => {
    it('removes all elements from the list if presence map empty', async () => {
      const w = createJSONWrapper<ImageList>({
        items: ['a', 'b', 'c'],
        presenceMap: {}
      });

      syncListWithPresenceMap(w.value);
      expect(await w.nextTick()).to.eql({
        items: [],
        presenceMap: {},
      });
    });

    it('adds all elements to an empty list to the presence map', async () => {
      const w = createJSONWrapper<ImageList>({
        items: [],
        presenceMap: { a: true, b: true, c: true }
      });

      syncListWithPresenceMap(w.value);
      expect(await w.nextTick()).to.eql({
        items: ['a', 'b', 'c'],
        presenceMap: { a: true, b: true, c: true },
      });
    });

    it('removes and adds elements as needed to a non-empty list', async () => {
      const w = createJSONWrapper<ImageList>({
        items: ['b', 'd'],
        presenceMap: { b: true, c: true }
      });

      syncListWithPresenceMap(w.value);
      expect(await w.nextTick()).to.eql({
        items: ['b', 'c'],
        presenceMap: { b: true, c: true },
      });
    })
  });

  describe('isMatchingFilterSettings()', () => {
    it('no filters match everything', () => {
      expect(isMatchingFilterSettings(filterSettings(), imageFile(), imageMetadata({ label: Label.BLUE }))).to.equal(true);
      expect(isMatchingFilterSettings(filterSettings(), imageFile(), imageMetadata({ rating: 1 }))).to.equal(true);
      expect(isMatchingFilterSettings(filterSettings(), imageFile({ path: '/some/path' }), imageMetadata())).to.equal(true);
    });

    it('single label filter matches only images with corresponding label', () => {
      const fs = filterSettings({ selectedLabels: [Label.BLUE] });
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.BLUE }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.RED }))).to.equal(false);
    });

    it('multiple labels filter matches images with any of mentioned labels', () => {
      const fs = filterSettings({ selectedLabels: [Label.BLUE, Label.CYAN] });
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.BLUE }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.CYAN }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.RED }))).to.equal(false);
    });

    it('single rating filter matches only images with corresponding rating', () => {
      const fs = filterSettings({ selectedRatings: [1] });
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 1 }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 0 }))).to.equal(false);
    });

    it('multiple ratings filter matches images with any of mentioned ratings', () => {
      const fs = filterSettings({ selectedRatings: [1, 2] });
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 1 }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 2 }))).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 0 }))).to.equal(false);
    });

    it('single path filter matches only images with corresponding dirname', () => {
      const fs = filterSettings({ selectedPaths: ['/some/path'] });
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/path/image' }), imageMetadata())).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/other/image' }), imageMetadata())).to.equal(false);
    });

    it('multiple paths filter matches images with any of mentioned dirnames', () => {
      const fs = filterSettings({ selectedPaths: ['/some/path', '/foo/bar'] });
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/path/image' }), imageMetadata())).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/foo/bar/image' }), imageMetadata())).to.equal(true);
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/other/image' }), imageMetadata())).to.equal(false);
    });

    it('combinations of filters use logical AND', () => {
      const fs = filterSettings({ selectedLabels: [Label.BLUE], selectedRatings: [1], selectedPaths: ['/some/path'] });

      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.BLUE }))).to.equal(false);
      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ rating: 1 }))).to.equal(false);
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/path/image' }), imageMetadata())).to.equal(false);

      expect(isMatchingFilterSettings(fs, imageFile(), imageMetadata({ label: Label.BLUE, rating: 1 }))).to.equal(false);
      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/path/image' }), imageMetadata({ rating: 1 }))).to.equal(false);

      expect(isMatchingFilterSettings(fs, imageFile({ path: '/some/path/image' }), imageMetadata({ label: Label.BLUE, rating: 1 }))).to.equal(true);
    });
  });

  describe('updateItemInList()', () => {
    it('does nothing if item matches filters and is already present', async () => {
      const w = createJSONWrapper<ImageList>({
        items: ['a'],
        presenceMap: { a: true },
      });

      updateItemInList(w.value, filterSettings(), imageFile({ uid: 'a' }), imageMetadata());
      expect(await w.nextTick()).to.eql({
        items: ['a'],
        presenceMap: { a: true },
      });
    });

    it('adds item to the list if it matches filters but is not in the presence map', async () => {
      const w = createJSONWrapper<ImageList>({
        items: ['a'],
        presenceMap: { a: true },
      });

      updateItemInList(w.value, filterSettings(), imageFile({ uid: 'b' }), imageMetadata());
      expect(await w.nextTick()).to.eql({
        items: ['a', 'b'],
        presenceMap: { a: true, b: true },
      });

    });

    it('removes itesm from the presence map and from the list if it does not match filters', async () => {
      const w = createJSONWrapper<ImageList>({
        items: ['a'],
        presenceMap: { a: true },
      });

      updateItemInList(w.value, filterSettings({ selectedLabels: [Label.BLUE] }), imageFile({ uid: 'a' }), imageMetadata());
      expect(await w.nextTick()).to.eql({
        items: [],
        presenceMap: {},
      });
    });
  });

  describe('updateListsWithFilter()', () => {
    it('if list corresponding to filter settings exists, syncs it', async () => {
      const w = createJSONWrapper<{ [key: string]: ImageList }>({
        '': {
          items: ['a'],
          presenceMap: { a: true, b: true },
        }
      });

      updateListsWithFilter(filterSettings(), w.value, {}, {});
      expect(await w.nextTick()).to.eql({
        '': {
          items: ['a', 'b'],
          presenceMap: { a: true, b: true },
        }
      });
    });

    it('if no list corresponding to filter settings exists, creates it', async () => {
      const w = createJSONWrapper<{ [key: string]: ImageList }>({
        '': {
          items: ['a', 'b'],
          presenceMap: { a: true, b: true },
        }
      });

      updateListsWithFilter(filterSettings({ selectedLabels: [Label.BLUE] }), w.value, { a: imageFile({ uid: 'a' }), b: imageFile({ uid: 'b' }) }, { a: imageMetadata({ label: Label.GRAY }), b: imageMetadata({ label: Label.BLUE }) });
      expect(await w.nextTick()).to.eql({
        '': {
          items: ['a', 'b'],
          presenceMap: { a: true, b: true },
        },
        '|label:3|': {
          items: ['b'],
          presenceMap: { b: true },
        }
      });
    });
  });
});
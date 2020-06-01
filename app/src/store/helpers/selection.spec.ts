import Vue from 'vue';
import { Selection, ImageList } from "@/store/schema";
import { assert, expect } from 'chai'
import { pureCopy } from '@/lib/test-utils';
import { selectRange } from './selection';

describe('Store selection helpers', () => {
  function createSelection(selection: Partial<Selection> = {}): Selection {
    return Vue.observable({
      primary: undefined,
      lastTouched: undefined,
      additional: {},
      ...selection,
    });
  }

  function createImageList(imageList: Partial<ImageList> = {}): ImageList {
    return Vue.observable({
      items: [],
      presenceMap: {},
      ...imageList
    });
  }

  describe('selectPrimary()', () => {

  });

  describe('toggleAdditionalSelection()', () => {

  });

  describe('movePrimarySelection()', () => {

  });

  describe('moveAdditionalSelection()', () => {

  });

  describe('selectRange()', () => {
    it('does nothing if no primary selection', () => {
      const selection = createSelection();
      const selectionSnapshot = pureCopy(selection);
      const imageList = createImageList();

      selectRange(selection, imageList, 'a');

      expect(pureCopy(selection)).to.eql(selectionSnapshot);
    });

    it('throws if primary selection not present in the current list', () => {
      const selection = createSelection({ primary: 'a' });
      const imageList = createImageList();

      assert.throws(() => selectRange(selection, imageList, 'b'), /primary selection has to be in the current list/);
    });

    it('throws if target selection not present in the current list', () => {
      const selection = createSelection({ primary: 'a' });
      const imageList = createImageList({
        presenceMap: { a: true },
        items: ['a'],
      });

      assert.throws(() => selectRange(selection, imageList, 'b'), /target selection has to be in the current list/);
    });

    it('clears additional selection if target is equal to primary', () => {
      const selection = createSelection({ primary: 'a', additional: { b: true } });
      const imageList = createImageList({
        presenceMap: { a: true, b: true },
        items: ['a', 'b'],
      });

      selectRange(selection, imageList, 'a');

      expect(pureCopy(selection)).to.eql({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });
    });

    it('selects the range when target before primary', () => {
      const selection = createSelection({ primary: 'c' });
      const imageList = createImageList({
        presenceMap: { a: true, b: true, c: true, d: true },
        items: ['a', 'b', 'c', 'd', 'e'],
      });

      selectRange(selection, imageList, 'a');

      expect(pureCopy(selection)).to.eql({
        primary: 'c',
        lastTouched: 'a',
        additional: { a: true, b: true },
      });
    });

    it('selects the range when target after primary', () => {
      const selection = createSelection({ primary: 'c' });
      const imageList = createImageList({
        presenceMap: { a: true, b: true, c: true, d: true },
        items: ['a', 'b', 'c', 'd', 'e'],
      });

      selectRange(selection, imageList, 'e');

      expect(pureCopy(selection)).to.eql({
        primary: 'c',
        lastTouched: 'e',
        additional: { d: true, e: true },
      });
    });
  });
})

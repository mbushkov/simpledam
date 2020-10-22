import { Selection, ImageList } from "@/store/schema";
import { assert, expect } from 'chai'
import { pureCopy, setupTestEnv } from '@/lib/test-utils';
import { selectRange, selectPrimary } from './selection';
import { reactive } from '@vue/composition-api';

setupTestEnv();

describe('Store selection helpers', () => {

  function createSelection(selection: Partial<Selection> = {}): Selection {
    return reactive({
      primary: undefined,
      lastTouched: undefined,
      additional: {},
      ...selection,
    });
  }

  function createImageList(imageList: Partial<ImageList> = {}): ImageList {
    return reactive({
      items: [],
      presenceMap: {},
      ...imageList
    });
  }

  describe('selectPrimary()', () => {
    it('does nothing if same primary is already selected', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });
      const selectionSnapshot = pureCopy(selection);

      selectPrimary(selection, 'a');

      expect(pureCopy(selection)).to.eql(selectionSnapshot);
    });

    it('resets additional selection if new primary is selected', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      selectPrimary(selection, 'c');

      expect(pureCopy(selection)).to.eql({
        primary: 'c',
        lastTouched: 'c',
        additional: {},
      } as Selection);
    });

    it('erases selection if undefined is passed', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      selectPrimary(selection, undefined);

      expect(pureCopy(selection)).to.eql({
        primary: undefined,
        lastTouched: undefined,
        additional: {},
      } as Selection);
    });
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

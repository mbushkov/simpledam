import { Selection, ImageList } from "@/store/schema";
import { assert, expect } from 'chai'
import { pureCopy, setupTestEnv } from '@/lib/test-utils';
import { selectRange, selectPrimary, toggleAdditionalSelection, Direction, movePrimarySelection, moveAdditionalSelection } from './selection';
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
    it('changes lastTouched attribute', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection, 'b');

      expect(selection.lastTouched).to.equal('b');
    });

    it('sets primary selection if no primary is set', () => {
      const selection = createSelection({
        primary: undefined,
        lastTouched: undefined,
        additional: {},
      });

      toggleAdditionalSelection(selection, 'a');

      expect(pureCopy(selection)).to.eql({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });
    });

    it('unsets primary if uid matches and additional selection is empty', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection, 'a');

      expect(pureCopy(selection)).to.eql({
        primary: undefined,
        lastTouched: 'a',
        additional: {},
      });
    });

    it('moves primary to the next additional selection if uid matches current primary', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, c: true, },
      });

      toggleAdditionalSelection(selection, 'a');

      expect(pureCopy(selection)).to.eql({
        primary: 'b',
        lastTouched: 'a',
        additional: { c: true },
      });
    });

    it('marks additional selection if previously unset', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection, 'b');

      expect(pureCopy(selection)).to.eql({
        primary: 'a',
        lastTouched: 'b',
        additional: { b: true },
      });
    });

    it('unmarks additional selection if previously set', () => {
      const selection = createSelection({
        primary: 'a',
        lastTouched: 'b',
        additional: { b: true },
      });

      toggleAdditionalSelection(selection, 'b');

      expect(pureCopy(selection)).to.eql({
        primary: 'a',
        lastTouched: 'b',
        additional: {},
      });
    });
  });

  describe('movePrimarySelection()', () => {
    // Assuming we're dealing with a squate-like structure.
    const imageList = createImageList({
      items: [
        'a', 'b', 'c',
        'd', 'e', 'f',
        'g', 'h', 'i',
      ],
    });

    function testDirection(from: string, direction: Direction, expected: string) {
      const selection = createSelection({
        primary: from,
      });

      movePrimarySelection(selection, imageList, 3, direction);

      expect(selection.primary).to.equal(expected);
    }

    it('correctly moves selection right', () => {
      function td(f: string, e: string) { testDirection(f, Direction.RIGHT, e) }

      td('a', 'b');
      td('b', 'c');
      td('c', 'd');
      td('d', 'e');
      td('e', 'f');
      td('f', 'g');
      td('g', 'h');
      td('h', 'i');
      td('i', 'i');
    });

    it('correctly moves selection left', () => {
      function td(f: string, e: string) { testDirection(f, Direction.LEFT, e) }

      td('a', 'a');
      td('b', 'a');
      td('c', 'b');
      td('d', 'c');
      td('e', 'd');
      td('f', 'e');
      td('g', 'f');
      td('h', 'g');
      td('i', 'h');
    });

    it('correctly moves selection up', () => {
      function td(f: string, e: string) { testDirection(f, Direction.UP, e) }

      td('a', 'a');
      td('b', 'a');
      td('c', 'a');
      td('d', 'a');
      td('e', 'b');
      td('f', 'c');
      td('g', 'd');
      td('h', 'e');
      td('i', 'f');
    });

    it('correctly moves selection down', () => {
      function td(f: string, e: string) { testDirection(f, Direction.DOWN, e) }

      td('a', 'd');
      td('b', 'e');
      td('c', 'f');
      td('d', 'g');
      td('e', 'h');
      td('f', 'i');
      td('g', 'i');
      td('h', 'i');
      td('i', 'i');
    });

    it('cleans additional selection', () => {
      const selection = createSelection({
        primary: 'a',
        additional: { b: true }
      });

      movePrimarySelection(selection, imageList, 3, Direction.RIGHT);

      expect(pureCopy(selection.additional)).to.eql({});
    });
  });

  describe('moveAdditionalSelection()', () => {
    // Assuming we're dealing with a squate-like structure.
    const imageList = createImageList({
      items: [
        'a', 'b', 'c',
        'd', 'e', 'f',
        'g', 'h', 'i',
      ],
    });

    function testExpandsFromCenter(directions: ReadonlyArray<Direction>, expectedLastTouched: string, expectedAdditional: { readonly [key: string]: boolean }) {
      const selection = createSelection({
        primary: 'e',
        additional: {}
      });

      for (const direction of directions) {
        moveAdditionalSelection(selection, imageList, 3, direction);
      }

      expect(pureCopy(selection)).to.eql({
        primary: 'e',
        lastTouched: expectedLastTouched,
        additional: expectedAdditional,
      });
    }

    it('expands selection from primary left', () => {
      testExpandsFromCenter([Direction.LEFT], 'd', { d: true });
    });

    it('expands selection from primary right', () => {
      testExpandsFromCenter([Direction.RIGHT], 'f', { f: true });
    });

    it('expands selection from primary up', () => {
      testExpandsFromCenter([Direction.UP], 'b', { b: true, c: true, d: true });
    });

    it('expands selection from primary down', () => {
      testExpandsFromCenter([Direction.DOWN], 'h', { f: true, g: true, h: true });
    });

    it('expands and shrinks selection from primary left then right', () => {
      testExpandsFromCenter([Direction.LEFT, Direction.RIGHT], 'e', {});
    });

    it('expands selection from primary right then left', () => {
      testExpandsFromCenter([Direction.RIGHT, Direction.LEFT], 'e', {});
    });

    it('expands selection from primary up then down', () => {
      testExpandsFromCenter([Direction.UP, Direction.DOWN], 'e', {});
    });

    it('expands selection from primary down then up', () => {
      testExpandsFromCenter([Direction.DOWN, Direction.UP], 'e', {});
    });    
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

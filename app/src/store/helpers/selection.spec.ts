import { createJSONWrapper, ObservableWrapper, setupTestEnv } from '@/lib/test-utils';
import { ImageList, Selection } from "@/store/schema";
import { assert, expect } from 'chai';
import { Direction, moveAdditionalSelection, movePrimarySelection, selectPrimary, selectPrimaryPreservingAdditionalIfPossible, selectRange, toggleAdditionalSelection } from './selection';

setupTestEnv();

describe('Store selection helpers', () => {

  function createSelectionWrapper(selection: Partial<Selection> = {}): ObservableWrapper<Selection> {
    return createJSONWrapper({
      primary: undefined,
      lastPrimaryIndex: 0,
      lastTouched: undefined,
      lastTouchedIndex: 0,
      additional: {},
      ...selection,
    });
  }

  function expectedSelection(selection: Partial<Selection> = {}): Selection {
    return {
      primary: undefined,
      lastPrimaryIndex: 0,
      lastTouched: undefined,
      lastTouchedIndex: 0,
      additional: {},
      ...selection,
    }
  }

  function createImageList(imageList: Partial<ImageList> = {}): ImageList {
    return {
      items: [],
      presenceMap: {},
      ...imageList
    };
  }

  describe('selectPrimary()', () => {
    it('does nothing if same primary is already selected', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      const selectionSnapshot = selection.snapshot();
      selectPrimary(selection.value, 'a');
      expect(await selection.nextTick()).to.eql(selectionSnapshot);
    });

    it('resets additional selection if new primary is selected', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      selectPrimary(selection.value, 'c');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'c',
        lastTouched: 'c',
        additional: {},
      }));
    });

    it('erases selection if undefined is passed', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      selectPrimary(selection.value, undefined);

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: undefined,
        lastTouched: undefined,
        additional: {},
      }));
    });
  });

  describe('selectPrimaryPreservingAdditionalIfPossible()', () => {
    it('does nothing if new selection matches primary', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      });

      selectPrimaryPreservingAdditionalIfPossible(selection.value, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, }
      }));
    });

    it('moves selection within additional selection', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, c: true }
      });

      selectPrimaryPreservingAdditionalIfPossible(selection.value, 'b');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'b',
        lastTouched: 'b',
        additional: { a: true, c: true, }
      }));
    });

    it('resets the selection if outside of the primary and additional', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, c: true }
      });

      selectPrimaryPreservingAdditionalIfPossible(selection.value, 'd');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'd',
        lastTouched: 'd',
        additional: {}
      }));
    });
  });

  describe('toggleAdditionalSelection()', () => {
    it('changes lastTouched attribute', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection.value, 'b');

      expect((await selection.nextTick()).lastTouched).to.equal('b');
    });

    it('sets primary selection if no primary is set', async () => {
      const selection = createSelectionWrapper({
        primary: undefined,
        lastTouched: undefined,
        additional: {},
      });

      toggleAdditionalSelection(selection.value, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      }));
    });

    it('unsets primary if uid matches and additional selection is empty', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection.value, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: undefined,
        lastTouched: 'a',
        additional: {},
      }));
    });

    it('moves primary to the next additional selection if uid matches current primary', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: { b: true, c: true, },
      });

      toggleAdditionalSelection(selection.value, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'b',
        lastTouched: 'a',
        additional: { c: true },
      }));
    });

    it('marks additional selection if previously unset', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      });

      toggleAdditionalSelection(selection.value, 'b');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'a',
        lastTouched: 'b',
        additional: { b: true },
      }));
    });

    it('unmarks additional selection if previously set', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        lastTouched: 'b',
        additional: { b: true },
      });

      toggleAdditionalSelection(selection.value, 'b');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'a',
        lastTouched: 'b',
        additional: {},
      }));
    });
  });

  describe('movePrimarySelection()', async () => {
    // Assuming we're dealing with a squate-like structure.
    const imageList = createImageList({
      items: [
        'a', 'b', 'c',
        'd', 'e', 'f',
        'g', 'h', 'i',
      ],
    });

    async function testDirection(from: string, direction: Direction, expected: string) {
      const selection = createSelectionWrapper({
        primary: from,
      });

      movePrimarySelection(selection.value, imageList, 3, direction);

      expect((await selection.nextTick()).primary).to.equal(expected);
    }

    it('correctly moves selection right', async () => {
      async function td(f: string, e: string) { await testDirection(f, Direction.RIGHT, e) }

      await td('a', 'b');
      await td('b', 'c');
      await td('c', 'd');
      await td('d', 'e');
      await td('e', 'f');
      await td('f', 'g');
      await td('g', 'h');
      await td('h', 'i');
      await td('i', 'i');
    });

    it('correctly moves selection left', async () => {
      async function td(f: string, e: string) { await testDirection(f, Direction.LEFT, e) }

      await td('a', 'a');
      await td('b', 'a');
      await td('c', 'b');
      await td('d', 'c');
      await td('e', 'd');
      await td('f', 'e');
      await td('g', 'f');
      await td('h', 'g');
      await td('i', 'h');
    });

    it('correctly moves selection up', async () => {
      async function td(f: string, e: string) { await testDirection(f, Direction.UP, e) }

      await td('a', 'a');
      await td('b', 'a');
      await td('c', 'a');
      await td('d', 'a');
      await td('e', 'b');
      await td('f', 'c');
      await td('g', 'd');
      await td('h', 'e');
      await td('i', 'f');
    });

    it('correctly moves selection down', async () => {
      async function td(f: string, e: string) { await testDirection(f, Direction.DOWN, e) }

      await td('a', 'd');
      await td('b', 'e');
      await td('c', 'f');
      await td('d', 'g');
      await td('e', 'h');
      await td('f', 'i');
      await td('g', 'i');
      await td('h', 'i');
      await td('i', 'i');
    });

    it('cleans additional selection', async () => {
      const selection = createSelectionWrapper({
        primary: 'a',
        additional: { b: true }
      });

      movePrimarySelection(selection.value, imageList, 3, Direction.RIGHT);

      expect((await selection.nextTick()).additional).to.eql({});
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

    async function testExpandsFromCenter(directions: ReadonlyArray<Direction>, expectedLastTouched: string, expectedAdditional: { readonly [key: string]: boolean }) {
      const selection = createSelectionWrapper({
        primary: 'e',
        additional: {}
      });

      for (const direction of directions) {
        moveAdditionalSelection(selection.value, imageList, 3, direction);
      }

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'e',
        lastTouched: expectedLastTouched,
        additional: expectedAdditional,
      }));
    }

    it('expands selection from primary left', async () => {
      await testExpandsFromCenter([Direction.LEFT], 'd', { d: true });
    });

    it('expands selection from primary right', async () => {
      await testExpandsFromCenter([Direction.RIGHT], 'f', { f: true });
    });

    it('expands selection from primary up', async () => {
      await testExpandsFromCenter([Direction.UP], 'b', { b: true, c: true, d: true });
    });

    it('expands selection from primary down', async () => {
      await testExpandsFromCenter([Direction.DOWN], 'h', { f: true, g: true, h: true });
    });

    it('expands and shrinks selection from primary left then right', async () => {
      await testExpandsFromCenter([Direction.LEFT, Direction.RIGHT], 'e', {});
    });

    it('expands selection from primary right then left', async () => {
      await testExpandsFromCenter([Direction.RIGHT, Direction.LEFT], 'e', {});
    });

    it('expands selection from primary up then down', async () => {
      await testExpandsFromCenter([Direction.UP, Direction.DOWN], 'e', {});
    });

    it('expands selection from primary down then up', async () => {
      await testExpandsFromCenter([Direction.DOWN, Direction.UP], 'e', {});
    });
  });

  describe('selectRange()', () => {
    it('does nothing if no primary selection', async () => {
      const selection = createSelectionWrapper();
      const selectionSnapshot = selection.snapshot();
      const imageList = createImageList();

      selectRange(selection.value, imageList, 'a');

      expect(await selection.nextTick()).to.eql(selectionSnapshot);
    });

    it('throws if primary selection not present in the current list', () => {
      const selection = createSelectionWrapper({ primary: 'a' });
      const imageList = createImageList();

      assert.throws(() => selectRange(selection.value, imageList, 'b'), /primary selection has to be in the current list/);
    });

    it('throws if target selection not present in the current list', () => {
      const selection = createSelectionWrapper({ primary: 'a' });
      const imageList = createImageList({
        presenceMap: { a: true },
        items: ['a'],
      });

      assert.throws(() => selectRange(selection.value, imageList, 'b'), /target selection has to be in the current list/);
    });

    it('clears additional selection if target is equal to primary', async () => {
      const selection = createSelectionWrapper({ primary: 'a', additional: { b: true } });
      const imageList = createImageList({
        presenceMap: { a: true, b: true },
        items: ['a', 'b'],
      });

      selectRange(selection.value, imageList, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'a',
        lastTouched: 'a',
        additional: {},
      }));
    });

    it('selects the range when target before primary', async () => {
      const selection = createSelectionWrapper({ primary: 'c' });
      const imageList = createImageList({
        presenceMap: { a: true, b: true, c: true, d: true },
        items: ['a', 'b', 'c', 'd', 'e'],
      });

      selectRange(selection.value, imageList, 'a');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'c',
        lastTouched: 'a',
        additional: { a: true, b: true },
      }));
    });

    it('selects the range when target after primary', async () => {
      const selection = createSelectionWrapper({ primary: 'c' });
      const imageList = createImageList({
        presenceMap: { a: true, b: true, c: true, d: true },
        items: ['a', 'b', 'c', 'd', 'e'],
      });

      selectRange(selection.value, imageList, 'e');

      expect(await selection.nextTick()).to.eql(expectedSelection({
        primary: 'c',
        lastTouched: 'e',
        additional: { d: true, e: true },
      }));
    });
  });
})

import Vue from 'vue';
import { defineComponent, computed, reactive } from '@vue/composition-api';
import { storeSingleton } from '@/store';
import { apiServiceSingleton } from '@/backend/api';
import Pane from './Pane.vue';
import { DRAG_HELPER_SERVICE } from '@/lib/drag-helper-service';
import * as log from 'loglevel';

declare interface PathEntry {
  path: string;
  selected: boolean;
  count: number;
}

export default defineComponent({
  // type inference enabled
  components: {
    Pane,
  },
  setup() {
    const store = storeSingleton();
    const apiService = apiServiceSingleton();

    const highlights: { [key: string]: boolean } = reactive({});

    const entries = computed(() => {
      const keys = Object.keys(store.state.paths);
      keys.sort();
      return keys.map(k => ({
        path: k,
        selected: store.state.filterSettings.selectedPaths.indexOf(k) !== -1,
        count: store.numItemsMatchingFilter({
          selectedPaths: [k],
          selectedLabels: [],
          selectedRatings: [],
        })
      }));
    });

    function pathClicked(entry: PathEntry, event: MouseEvent) {
      store.changePathFilter(entry.path, !entry.selected, event.metaKey);
    }

    function rowDragEntered(path: string, event: DragEvent) {
      log.info('[PathsPane] Row drag entered:', path, event.dataTransfer?.dropEffect);
    }

    function rowDraggedOver(path: string, event: DragEvent) {
      if (DRAG_HELPER_SERVICE.eventHasFiles(event)) {
        Vue.set(highlights, path, true);
      }
    }

    function rowDragLeft(path: string) {
      Vue.set(highlights, path, false);
    }

    function rowDropped(path: string, event: DragEvent) {
      log.info('[PathsPane] Row dropped:', path, event.dataTransfer?.dropEffect);

      Vue.set(highlights, path, false)

      const dragResult = DRAG_HELPER_SERVICE.finishDrag(event);
      if (!dragResult) {
        return;
      }
      let srcPaths: string[];
      if (dragResult.contents.kind === 'internal') {
        srcPaths = dragResult.contents.uids.map(uid => store.state.images[uid].path);
      } else {
        throw new Error('Dragging external files onto a folder not implemented yet.')
      }

      let destPathRoot = path;
      if (!destPathRoot.endsWith('/')) {
        destPathRoot += '/';
      }

      log.info(`[PathsPane] Will move ${srcPaths.length} files to:`, destPathRoot)
      for (const srcPath of srcPaths) {
        log.info('[PathsPane] Processing path move:', srcPath)
        const srcComponents = srcPath.split('/');
        const destPath = destPathRoot + srcComponents[srcComponents.length - 1];

        apiService.movePath(srcPath, destPath);
      }
    }

    return {
      highlights,
      entries,
      pathClicked,
      rowDragEntered,
      rowDraggedOver,
      rowDragLeft,
      rowDropped,
    };
  }
});
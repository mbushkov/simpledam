<template>
  <Pane title="Paths">
    <div class="paths">
      <div
        class="row"
        v-for="entry in entries"
        :key="entry.path"
        :class="{'drag-highlighted': highlights[entry.path]}"
        @dragenter.prevent="rowDragEntered(entry.path, $event)"
        @dragover.prevent="rowDraggedOver(entry.path, $event)"
        @dragleave="rowDragLeft(entry.path)"
        @drop="rowDropped(entry.path, $event)"
      >
        <div class="path-name">
          <span class="path-title">{{ entry.path }}</span>
        </div>
        <div class="path-count">
          <span class="count">{{ entry.count }}</span>
          <b-radio
            size="is-small"
            type="is-path-selected"
            native-value="true"
            v-model="entry.selected"
            v-on:click.native.prevent="pathClicked(entry, $event)"
          ></b-radio>
        </div>
      </div>
    </div>
  </Pane>
</template>

<style lang="scss" scoped>
@import '../../styles/variables';

.paths {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 3px;
    margin-bottom: 3px;

    &.drag-highlighted {
      background-color: $nm-background-color-selected;
      color: $nm-text-color-selected !important;
    }

    .path-name {
      display: flex;
      align-items: center;
      overflow: hidden;
      width: 100%;
      padding-right: 1em;
      color: $nm-text-color;

      span.path-title {
        font-size: 13px;
        width: 100%;
        overflow: hidden;
        text-align: left;
        line-height: 100%;
        overflow-wrap: break-word;
      }
    }

    .path-count {
      display: flex;
      align-items: center;
      color: $nm-text-color;
      font-size: 13px;

      span.count {
        margin-right: 0.5em;
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>

<script lang="ts">
import Vue from 'vue';
import { defineComponent, computed, reactive } from '@vue/composition-api';
import { STORE } from '@/store';
import { API_SERVICE } from '@/backend/api';
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
    const highlights: { [key: string]: boolean } = reactive({});

    const entries = computed(() => {
      const keys = Object.keys(STORE.state.paths);
      keys.sort();
      return keys.map(k => ({
        path: k,
        selected: STORE.state.filterSettings.selectedPaths.indexOf(k) !== -1,
        count: STORE.numItemsMatchingFilter({
          selectedPaths: [k],
          selectedLabels: [],
          selectedRatings: [],
        })
      }));
    });

    function pathClicked(entry: PathEntry, event: MouseEvent) {
      STORE.changePathFilter(entry.path, !entry.selected, event.metaKey);
    }

    function rowDragEntered(path: string, event: DragEvent) {
      log.info('[PathsPane] Row drag entered:', path, event.dataTransfer.dropEffect);
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
      log.info('[PathsPane] Row dropped:', path, event.dataTransfer.dropEffect);

      Vue.set(highlights, path, false)

      const dragResult = DRAG_HELPER_SERVICE.finishDrag(event);
      if (!dragResult) {
        return;
      }
      let srcPaths: string[];
      if (dragResult.contents.kind === 'internal') {
        srcPaths = dragResult.contents.uids.map(uid => STORE.state.images[uid].path);
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

        API_SERVICE.movePath(srcPath, destPath);
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
</script>
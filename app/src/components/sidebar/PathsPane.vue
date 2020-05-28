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
import { API_SERVICE } from '@/api';
import Pane from './Pane.vue';

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
      console.log(['row drag enter', path, event]);
    }

    function rowDraggedOver(path: string, event: DragEvent) {
      console.log(['row drag over', event?.dataTransfer?.files, event.dataTransfer?.getData('nmUids')]);
      if (event?.dataTransfer?.files || event.dataTransfer?.getData('nmUids')) {
        Vue.set(highlights, path, true);
      }
    }

    function rowDragLeft(path: string) {
      Vue.set(highlights, path, false);
    }

    function rowDropped(path: string, event: DragEvent) {
      Vue.set(highlights, path, false)

      console.log(['row dropped', path, event]);

      let srcPaths: string[] | undefined;
      const nmUidsData = event.dataTransfer?.getData('nmUids')
      if (nmUidsData) {
        console.log(['using uids', nmUidsData]);
        const nmUids: string[] = JSON.parse(nmUidsData);
        srcPaths = nmUids.map(uid => STORE.state.images[uid].path);
      } else if (event?.dataTransfer?.files) {
        srcPaths = [];
        for (let i = 0; i < event.dataTransfer.files.length; ++i) {
          const srcPath = event.dataTransfer.files.item(i)!.path;
          srcPaths.push(srcPath);
        }
      }

      if (!srcPaths || srcPaths.length === 0) {
        console.log('no files');
        return;
      }

      console.log(['will process', srcPaths.length]);
      for (const srcPath of srcPaths) {
        console.log(['processing', srcPath]);
        let destPath = path;
        if (!destPath.endsWith('/')) {
          destPath += '/';
        }
        const srcComponents = srcPath.split('/');
        destPath += srcComponents[srcComponents.length - 1];

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
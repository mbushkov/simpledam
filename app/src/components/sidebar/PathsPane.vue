<template>
  <Pane title="Paths">
    <div class="paths">
      <div class="row" v-for="entry in entries" :key="entry.path">
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
    height: 24px;

    .path-name {
      display: flex;
      align-items: center;
      overflow: hidden;
      width: 100%;
      padding-right: 1em;
      color: $nm-text-color;

      span.path-title {
        position: relative;
        top: 1px;
        font-size: 13px;
        width: 100%;
        overflow: hidden;
        text-align: left;
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
import { defineComponent, computed } from '@vue/composition-api';
import { STORE } from '@/store';
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

    return {
      entries,
      pathClicked,
    };
  }
});
</script>
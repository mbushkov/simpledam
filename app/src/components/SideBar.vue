<template>
  <div class="host">
    <div class="labels">
      <div class="row" v-for="entry in entries" :key="entry.title">
        <div class="label-name">
          <b-icon :type="{['is-label-' + entry.title]: true}" icon="checkbox-blank" class="icon"></b-icon>
          <span
            class="label-title"
          >{{ entry.title[0].toUpperCase() + entry.title.slice(1) }} [{{ entry.keyStroke }}]</span>
        </div>
        <div class="label-count">
          <span class="count">{{ counts[entry.label] }}</span>
          <b-radio size="is-small" 
            type="is-label-selected" 
            native-value="true" 
            v-model="entry.selected"
            v-on:click.native.prevent="labelClicked(entry, $event)">
          </b-radio>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.host {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
}

.labels {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .label-name {
      display: flex;
      align-items: center;
      color: $nm-text-color;
      font-size: 13px;

      span.label-title {
        position: relative;
        top: 1px;
      }
    }

    .label-count {
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
import { defineComponent, computed, Ref, reactive, watchEffect } from '@vue/composition-api';  // eslint-disable-line no-unused-vars
import { Label, STORE } from '@/store';

declare interface LabelEntry {
  title: string;
  keyStroke: string;
  label: Label;
  selected: boolean;
}

function labelEntry(title: string, keyStroke: string, label: Label): LabelEntry {
  return {
    title, 
    keyStroke, 
    label, 
    selected: false,
  };
}

export default defineComponent({
  // type inference enabled
  setup() {
    const entries: LabelEntry[] = reactive([
      labelEntry("none", "0", Label.NONE),
      labelEntry("red", "1", Label.RED),
      labelEntry("green", "2", Label.GREEN),
      labelEntry("blue", "3", Label.BLUE),
      labelEntry("brown", "4", Label.BROWN),
      labelEntry("magenta", "5", Label.MAGENTA),
      labelEntry("orange", "6", Label.ORANGE),
      labelEntry("yellow", "7", Label.YELLOW),
      labelEntry("cyan", "8", Label.CYAN),
      labelEntry("gray", "9", Label.GRAY),
    ]);

    watchEffect(() => {
      const selected = STORE.state.filterSettings.selectedLabels;
      for (const le of entries) {
        le.selected = (selected.indexOf(le.label) !== -1);
      }
    });

    const _counts: { [key: number]: Readonly<Ref<number>> } = {};
    for (const le of entries) {
      _counts[le.label] = computed(() => {
        return STORE.numItemsMatchingFilter({
          selectedLabels: [le.label],
          selectedStarRatings: [],
        });
      });
    }
    const counts = reactive(_counts);

    function labelClicked(entry: LabelEntry, event: MouseEvent) {
      STORE.changeLabelFilter(entry.label, !entry.selected, event.metaKey);
    }

    return {
      entries: entries,
      counts: counts,
      labelClicked,
    };
  }
});
</script>
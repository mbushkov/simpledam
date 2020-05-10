<template>
  <div class="host">

    <div class="labels">
      <div class="row" v-for="entry in ENTRIES" :key="entry.title">
        <div class="label-name">
          <b-icon :type="{['is-label-' + entry.title]: true}" icon="checkbox-blank" class="icon"></b-icon>
          <span class="label-title">{{ entry.title[0].toUpperCase() + entry.title.slice(1) }} [{{ entry.keyStroke }}]</span>
        </div>
        <div class="label-count">
          <span class="count">{{ counts[entry.value] }}</span>
          <b-checkbox size="is-small" type="is-label-selected"></b-checkbox>
        </div>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";
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
import { defineComponent, computed, Ref, reactive } from '@vue/composition-api';  // eslint-disable-line no-unused-vars
import { Label, STORE } from '@/store';

declare interface LabelEntry {
  title: string;
  keyStroke: string;
  value: Label;
}

function labelEntry(title: string, keyStroke: string, value: Label): LabelEntry {
  return {
    title, keyStroke, value,
  };
}

const ENTRIES: LabelEntry[] = [
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
];

export default defineComponent({
  // type inference enabled
  setup() {
    const counts: {[key: number]: Readonly<Ref<number>>} = {};
    for (const le of ENTRIES) {
      counts[le.value] = computed(() => {
        return STORE.numItemsMatchingFilter({
          selectedLabels: [le.value],
          selectedStarRatings: [],
        });
      });
    }

    return {
      ENTRIES,
      counts: reactive(counts),
    };
  }
});
</script>
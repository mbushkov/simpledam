<template>
  <Pane title="Rating">
    <div class="ratings">
      <div class="row" v-for="entry in entries" :key="entry.rating">
        <div class="rating-name">
          <span class="rating-title" v-if="entry.rating === 0">None</span>
          <span class="rating-icons" v-if="entry.rating > 0">
            <b-rate :disabled="true" :max="entry.rating" size="is-small"></b-rate>
          </span>
        </div>
        <div class="rating-count">
          <span class="count">{{ counts[entry.rating] }}</span>
          <b-radio
            size="is-small"
            type="is-rating-selected"
            native-value="true"
            v-model="entry.selected"
            v-on:click.native.prevent="ratingClicked(entry, $event)"
          ></b-radio>
        </div>
      </div>
    </div>
  </Pane>
</template>

<style lang="scss" scoped>
@import '../../styles/variables';

.ratings {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 24px;

    .rating-name {
      display: flex;
      align-items: center;
      color: $nm-text-color;

      span.rating-title {
        position: relative;
        top: 1px;
        font-size: 13px;
      }

      span.rating-icons {
        font-size: 15px;
        color: $nm-text-color;
      }
    }

    .rating-count {
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
import { defineComponent, computed, Ref, reactive, watchEffect } from '@vue/composition-api';
import { storeSingleton } from '@/store';
import Pane from './Pane.vue';
import { Rating } from '@/store/schema';

declare interface RatingEntry {
  rating: Rating;
  selected: boolean;
}

function ratingEntry(rating: Rating): RatingEntry {
  return {
    rating,
    selected: false,
  };
}

export default defineComponent({
  // type inference enabled
  components: {
    Pane,
  },
  setup() {
    const store = storeSingleton();

    const entries: RatingEntry[] = reactive([
      ratingEntry(0),
      ratingEntry(1),
      ratingEntry(2),
      ratingEntry(3),
      ratingEntry(4),
      ratingEntry(5),
    ]);

    watchEffect(() => {
      const selected = store.state.filterSettings.selectedRatings;
      for (const le of entries) {
        le.selected = (selected.indexOf(le.rating) !== -1);
      }
    });

    const _counts: { [key: number]: Readonly<Ref<number>> } = {};
    for (const le of entries) {
      _counts[le.rating] = computed(() => {
        return store.numItemsMatchingFilter({
          selectedRatings: [le.rating],
          selectedLabels: [],
          selectedPaths: [],
        });
      });
    }
    const counts = reactive(_counts);

    function ratingClicked(entry: RatingEntry, event: MouseEvent) {
      store.changeRatingFilter(entry.rating, !entry.selected, event.metaKey);
    }

    return {
      entries: entries,
      counts: counts,
      ratingClicked,
    };
  }
});
</script>
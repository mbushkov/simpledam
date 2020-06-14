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
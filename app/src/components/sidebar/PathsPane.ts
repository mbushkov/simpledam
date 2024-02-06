import { apiServiceSingleton } from '@/backend/api';
import Radio from '@/components/core/Radio.vue';
import { dragHelperServiceSingleton } from '@/lib/drag-helper-service';
import { storeSingleton } from '@/store';
import * as log from 'loglevel';
import { computed, defineComponent, reactive } from 'vue';
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
    Radio,
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

    return {
      highlights,
      entries,
      pathClicked,
    };
  }
});
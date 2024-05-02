import Icon from '@/components/core/Icon.vue';
import Radio from '@/components/core/Radio.vue';
import { storeSingleton } from '@/store';
import { Label } from '@/store/schema';
import { computed, defineComponent, reactive, watchEffect, type Ref } from 'vue';
import Pane from './Pane.vue';

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
  components: {
    Pane,
    Icon,
    Radio,
  },
  setup() {
    const store = storeSingleton();

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
      const selected = store.state.filterSettings.selectedLabels;
      for (const le of entries) {
        le.selected = (selected.indexOf(le.label) !== -1);
      }
    });

    const _counts: { [key: number]: Readonly<Ref<number>> } = {};
    for (const le of entries) {
      _counts[le.label] = computed(() => {
        return store.numItemsMatchingFilter({
          selectedLabels: [le.label],
          selectedRatings: [],
          selectedPaths: [],
        });
      });
    }
    const counts = reactive(_counts);

    function labelClicked(entry: LabelEntry, event: MouseEvent) {
      store.changeLabelFilter(entry.label, !entry.selected, event.metaKey);
    }

    return {
      entries: entries,
      counts: counts,
      labelClicked,
    };
  }
});
import { apiServiceSingleton } from '@/backend/api';
import NmCheckbox from '@/components/core/Checkbox.vue';
import NmProgress from '@/components/core/Progress.vue';
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { storeSingleton } from '@/store';
import { computed, defineComponent, ref } from 'vue';
import { VueFinalModal } from 'vue-final-modal';

export default defineComponent({
  components: {
    NmCheckbox,
    NmProgress,
    VueFinalModal,
  },

  setup() {
    const closeFn = ref<Function>();

    const prefixWithIndex = ref<boolean>(true);
    const destinationPath = ref<string | undefined>();
    const inProgress = ref<boolean>(false);
    const noneConstant = computed(() => '<destination folder not selected>');

    function openFolderDialog() {
      electronHelperServiceSingleton().showDestinationFolderDialog((path) => {
        if (path) {
          destinationPath.value = path;
        }
      });
    }

    async function startExport() {
      const primary = storeSingleton().state.selection.primary;
      if (!primary) {
        closeFn.value!();
        return;
      }

      const selection = storeSingleton().state.selection;
      const srcUids: string[] = storeSingleton().currentList().items.filter(uid => {
        return uid === selection.primary || selection.additional[uid] !== undefined;
      })

      const images = storeSingleton().state.images;
      const srcs = srcUids.map(uid => images[uid].path);

      inProgress.value = true;
      await apiServiceSingleton().exportToPath(
        srcs,
        destinationPath.value!,
        {
          prefix_with_index: prefixWithIndex.value,
        });
      closeFn.value!();
    }

    return {
      prefixWithIndex,
      destinationPath,
      inProgress,
      noneConstant,

      closeFn,

      openFolderDialog,
      startExport,
    };
  }
});
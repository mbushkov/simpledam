import { apiServiceSingleton } from '@/backend/api';
import { electronHelperService } from '@/lib/electron-helper-service';
import { storeSingleton } from '@/store';
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  setup(_, { emit }) {
    const prefixWithIndex = ref<boolean>(true);
    const destinationPath = ref<string | undefined>();
    const noneConstant = computed(() => '<none>');

    function openFolderDialog() {
      electronHelperService().showDestinationFolderDialog((path) => {
        if (path) {
          destinationPath.value = path;
        }
      });
    }

    async function startExport() {
      const primary = storeSingleton().state.selection.primary;
      if (!primary) {
        emit('close');
        return;
      }

      const srcs: string[] = [];
      for (const uid of [
        primary,
        ...Object.keys(storeSingleton().state.selection.additional)
      ]) {
        srcs.push(storeSingleton().state.images[uid].path)
      }

      await apiServiceSingleton().exportToPath(
        srcs,
        destinationPath.value!,
        {
          prefix_with_index: prefixWithIndex.value,
        });
      emit('close');
    }

    return {
      prefixWithIndex,
      destinationPath,
      noneConstant,

      openFolderDialog,
      startExport,
    };
  }
});
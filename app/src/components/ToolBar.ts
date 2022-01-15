import { RotateCCWAction, RotateCWAction, ExportToFolderAction, ShowMediaFileAction } from '@/actions/selection';
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { storeSingleton, transientStoreSingleton } from '@/store';
import { computed, defineComponent } from '@vue/composition-api';
import Icon from '@/components/core/Icon.vue';

export default defineComponent({
  components: {
    Icon,
  },
  setup() {
    const transientStore = transientStoreSingleton();

    const leftPaneWidth = computed(() => {
      return transientStoreSingleton().state.leftPaneWidth;
    });

    const selectionPresent = computed(() => storeSingleton().state.selection.primary !== undefined);

    const currentTab = computed({
      get: () => transientStore.state.imageViewerTab,
      set: (v) => transientStore.setImageViewerTab(v)
    });

    // TODO: base buttons enabled/disabled status on actions "enabled" computed property.
    function showMediaFile() {
      if (!selectionPresent.value) {
        return;
      }
      new ShowMediaFileAction().perform();
    }

    function exportToFolder() {
      if (!selectionPresent.value) {
        return;
      }
      new ExportToFolderAction().perform();
    }

    function rotateLeft() {
      if (!selectionPresent.value) {
        return;
      }
      new RotateCCWAction().perform();
    }

    function rotateRight() {
      if (!selectionPresent.value) {
        return;
      }
      new RotateCWAction().perform();
    }

    function showLabelMenu() {
      if (!selectionPresent.value) {
        return;
      }
      electronHelperServiceSingleton().showLabelMenu();
    }

    function showRatingMenu() {
      if (!selectionPresent.value) {
        return;
      }
      electronHelperServiceSingleton().showRatingMenu();
    }

    return {
      leftPaneWidth,
      selectionPresent,
      currentTab,

      showMediaFile,
      exportToFolder,
      rotateLeft,
      rotateRight,
      showLabelMenu,
      showRatingMenu,
    };
  }
});
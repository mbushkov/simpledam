import { RotateCCWAction, RotateCWAction, ExportToFolderAction, ShowMediaFileAction } from '@/actions/selection';
import { electronHelperService } from '@/lib/electron-helper-service';
import { storeSingleton, transientStoreSingleton } from '@/store';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
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
      electronHelperService().showLabelMenu();
    }

    function showRatingMenu() {
      if (!selectionPresent.value) {
        return;
      }
      electronHelperService().showRatingMenu();
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
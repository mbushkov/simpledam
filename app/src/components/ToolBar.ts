import { RotateCCWAction, RotateCWAction } from '@/actions/edit';
import { ShowMediaFileAction } from '@/actions/file';
import { electronHelperService } from '@/lib/electron-helper-service';
import { transientStoreSingleton } from '@/store';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup() {
    const transientStore = transientStoreSingleton();

    const leftPaneWidth = computed(() => {
      return transientStoreSingleton().state.leftPaneWidth;
    });

    const currentTab = computed({
      get: () => transientStore.state.imageViewerTab,
      set: (v) => transientStore.setImageViewerTab(v)
    });

    function showMediaFile() {
      console.log('show media file');
      new ShowMediaFileAction().perform();
    }

    function rotateLeft() {
      new RotateCCWAction().perform();
    }

    function rotateRight() {
      new RotateCWAction().perform();
    }

    function showLabelMenu() {
      electronHelperService().showLabelMenu();
    }

    function showRatingMenu() {
      electronHelperService().showRatingMenu();
    }

    return {
      leftPaneWidth,
      currentTab,

      showMediaFile,
      rotateLeft,
      rotateRight,
      showLabelMenu,
      showRatingMenu,
    };
  }
});
import { defineComponent, computed, ref } from 'vue';
import ImageGrid from './ImageGrid.vue';
import SingleImage from './SingleImage.vue';
import Icon from '@/components/core/Icon.vue';
import InfoPane from './InfoPane.vue';
import { transientStoreSingleton, ImageViewerTab, storeSingleton } from '@/store';


export default defineComponent({
  components: {
    ImageGrid,
    SingleImage,
    Icon,
    InfoPane,
  },
  setup() {
    const transientStore = transientStoreSingleton();

    const imageGridRef = ref(undefined);
    const singleImageRef = ref(undefined);

    const currentTab = computed(() => transientStore.state.imageViewerTab);

    const imageFile = computed(() => {
      const sel = storeSingleton().state.selection.primary;
      if (sel) {
        return storeSingleton().state.images[sel];
      } else {
        return undefined;
      }
    });

    const infoPaneShown = computed(() => {
      return transientStore.state.infoPaneShown;
    });

    const infoIconType = computed(() => {
      return transientStore.state.infoPaneShown ? 'is-primary' : '';
    });

    function infoIconClicked() {
      transientStore.toggleInfoPaneShown();
    }

    return {
      imageGridRef,
      singleImageRef,

      infoPaneShown,
      infoIconType,
      infoIconClicked,

      currentTab,
      ImageViewerTab,
      imageFile,
    };
  }
});  
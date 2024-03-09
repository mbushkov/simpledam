import Icon from '@/components/core/Icon.vue';
import { ImageViewerTab, storeSingleton, transientStoreSingleton } from '@/store';
import { computed, defineComponent, ref } from 'vue';
import ImageGrid from './ImageGrid.vue';
import ImageList from './ImageList.vue';
import InfoPane from './InfoPane.vue';
import SingleImage from './SingleImage.vue';


export default defineComponent({
  components: {
    ImageList,
    ImageGrid,
    SingleImage,
    Icon,
    InfoPane,
  },
  setup() {
    const transientStore = transientStoreSingleton();

    const imageListRef = ref(undefined);
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
      imageListRef,
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
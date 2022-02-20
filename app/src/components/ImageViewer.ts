import { defineComponent, computed, ref } from 'vue';
import ImageGrid from './ImageGrid.vue';
import SingleImage from './SingleImage.vue';
import { transientStoreSingleton, ImageViewerTab, storeSingleton } from '@/store';


export default defineComponent({
  components: {
    ImageGrid,
    SingleImage,
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

    return {
      imageGridRef,
      singleImageRef,

      currentTab,
      ImageViewerTab,
      imageFile,
    };
  }
});  
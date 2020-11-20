import { defineComponent, computed, ref } from '@vue/composition-api';
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
      }
    });

    function handleResize() {
      if (imageGridRef.value) {
        (imageGridRef.value as any).handleResize();
      }
      if (singleImageRef.value) {
        (singleImageRef.value as any).handleResize();
      }
    }

    return {
      imageGridRef,
      singleImageRef,

      currentTab,
      ImageViewerTab,
      imageFile,
      handleResize,
    };
  }
});  
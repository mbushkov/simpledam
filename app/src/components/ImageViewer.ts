import { defineComponent, computed, ref } from '@vue/composition-api';
import ImageGrid from './ImageGrid.vue';
import SingleImage from './SingleImage.vue';
import { transientStoreSingleton, ImageViewerTab } from '@/store';


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

    function handleResize() {
      if (imageGridRef.value) {
        console.log(['imagegridref', imageGridRef.value]);
        (imageGridRef.value as any).handleResize();
      }
      if (singleImageRef.value) {
        console.log(['singleImageref', singleImageRef.value]);
        (singleImageRef.value as any).handleResize();
      }
    }

    return {
      imageGridRef,
      singleImageRef,

      currentTab,
      ImageViewerTab,
      handleResize,
    };
  }
});  
<template>
  <div class="image-viewer">
    <div class="mode-panel">
      <b-tabs class="top-tabs" size="is-small" type="is-toggle" v-model="currentTab">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>
    </div>
    <ImageGrid ref="imageGridRef" class="grow" v-show="currentTab === ImageViewerTab.THUMBNAILS"></ImageGrid>
    <SingleImage ref="singleImageRef" class="grow" v-if="currentTab === ImageViewerTab.MEDIA"></SingleImage>
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.image-viewer {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
  border: 1px solid black;

  .mode-panel {
    display: flex;
    flex-direction: row;

    .top-tabs {
      ::v-deep .tabs li {
        width: 200px;
        a {
          border-radius: 0;
        }
      }
      ::v-deep .tab-content {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  }

  .grow {
    flex-grow: 1;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(114, 114, 114, 1);
  }

  ::-webkit-scrollbar-thumb:window-inactive {
    background: rgba(114, 114, 114, 0.6);
  }
}
</style>
<script lang="ts">
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

    const currentTab = computed({
      get: () => transientStore.state.imageViewerTab,
      set: (v) => transientStore.setImageViewerTab(v)
    });

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
</script>
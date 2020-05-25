<template>
  <div class="image-viewer">
    <div class="mode-panel">
      <b-tabs class="top-tabs" size="is-small" type="is-toggle" v-model="currentTab">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>
    </div>
    <ImageGrid class="grow" v-show="currentTab === ImageViewerTab.THUMBNAILS"></ImageGrid>
    <SingleImage class="grow" v-if="currentTab === ImageViewerTab.MEDIA"></SingleImage>
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
}
</style>
<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import ImageGrid from './ImageGrid.vue';
import SingleImage from './SingleImage.vue';
import { TRANSIENT_STORE, ImageViewerTab } from '@/transient-store';


export default defineComponent({
  components: {
    ImageGrid,
    SingleImage,
  },
  setup() {
    const currentTab = computed({
      get: () => TRANSIENT_STORE.state.imageViewerTab,
      set: (v) => TRANSIENT_STORE.setImageViewerTab(v)
    });

    return {
      currentTab,
      ImageViewerTab,
    };
  }
});  
</script>
<template>
  <div class="host">
    <div class="mode-panel">
      <b-tabs class="top-tabs" size="is-small" type="is-toggle" v-model="currentTab">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>
    </div>
    <ImageGrid2 class="grow" v-show="currentTab === Tab.THUMBNAILS"></ImageGrid2>
    <SingleImage class="grow" v-if="currentTab === Tab.MEDIA"></SingleImage>
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.host {
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
import { defineComponent, ref } from '@vue/composition-api';
import ImageGrid2 from './ImageGrid2.vue';
import SingleImage from './SingleImage.vue';


enum Tab {
  THUMBNAILS = 0,
  MEDIA = 1
}


export default defineComponent({
  components: {
    ImageGrid2,
    SingleImage,
  },
  setup() {
    const currentTab = ref(Tab.THUMBNAILS);

    return {
      currentTab,
      Tab,
    };
  }
});  
</script>
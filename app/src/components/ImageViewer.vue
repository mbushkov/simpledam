<template>
  <div class="host">
    <div class="mode-panel">
      <b-tabs class="top-tabs" size="is-small" type="is-toggle">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>
    </div>
    <ImageGrid2 class="grow"></ImageGrid2>
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.host {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;

  .mode-panel {
    display: flex;
    flex-direction: row;
    justify-content: center;

    .top-tabs {
      ::v-deep .tabs li {
        width: 200px;
      }
      margin-bottom: 0 !important;
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


export default defineComponent({
  components: {
    ImageGrid2,
    SingleImage,
  },
  setup() {
    const mode = ref('thumbnails');

    return {
      mode,
    };
  }
});  
</script>
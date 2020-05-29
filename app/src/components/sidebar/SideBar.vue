<template>
  <splitpane-container class="side-bar" horizontal>
    <splitpane class="splitpane" :size="70">
      <LabelsPane></LabelsPane>
      <RatingsPane></RatingsPane>
    </splitpane>
    <splitpane :size="30" class="splitpane">
      <PathsPane></PathsPane>
    </splitpane>
  </splitpane-container>
</template>

<style lang="scss" scoped>
@import '../../styles/variables';

.side-bar {
  background-color: $nm-background-color;

  .splitpane {
    border: 1px solid black;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import LabelsPane from './LabelsPane.vue';
import RatingsPane from './RatingsPane.vue';
import PathsPane from './PathsPane.vue';

export default defineComponent({
  // type inference enabled
  components: {
    LabelsPane,
    RatingsPane,
    PathsPane,
  },
  setup() {

    return {
    };
  }
});
</script>
<template>
  <div class="host">
    <LabelsPane></LabelsPane>
  </div>
</template>

<style lang="scss" scoped>
@import '../../styles/variables';

.host {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
  padding-top: 25px;
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import LabelsPane from './LabelsPane.vue';

export default defineComponent({
  // type inference enabled
  components: {
    LabelsPane,
  },
  setup() {

    return {
    };
  }
});
</script>
<template>
  <div class="status-bar">
    <div>{{ backendState.catalogPath }}</div>
    <div
      v-if="backendState.catalogOpName"
    >{{ backendState.catalogOpName }} ({{ backendState.catalogOpProgress }})</div>
    <div
      v-if="backendState.previewQueueSize > 0"
    >{{ backendState.previewQueueSize }} previews pending</div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.status-bar {
  background-color: $nm-background-color;
  color: $nm-text-color;
  font-size: 13px;

  display: flex;
  align-items: center;

  > div {
    margin-right: 1em;
  }
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import { BACKEND_MIRROR } from '../backend-mirror';

export default defineComponent({
  setup() {

    return {
      backendState: BACKEND_MIRROR.state,
    }
  }
});
</script>
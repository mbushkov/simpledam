<template>
  <div class="host">
    <div>{{ backendState.catalogPath }}</div>
    <div
      v-if="backendState.catalogOpName"
    >{{ backendState.catalogOpName }} ({{ backendState.catalogOpProgress }})</div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.host {
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
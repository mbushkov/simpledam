<template>
  <div class="host">

    <div class="labels">
      <b-switch size="is-small">Small</b-switch>
    </div>

  </div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";
.host {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  // type inference enabled
});
</script>
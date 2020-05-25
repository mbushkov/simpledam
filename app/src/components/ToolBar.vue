<template>
  <div class="tool-bar"></div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.tool-bar {
  background-color: $nm-background-color;
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  // type inference enabled
});
</script>
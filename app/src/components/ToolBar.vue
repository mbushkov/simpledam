<template>
  <div class="host"></div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.host {
  background-color: $nm-background-color;
}
</style>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  // type inference enabled
});
</script>
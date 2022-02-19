<template>
  <div class="pane">
    <Collapse :title="title">
      <slot></slot>
    </Collapse>
  </div>
</template>
<style lang="scss" scoped>
@import "../../styles/variables";
</style>
<script lang="ts">
import Pane from "./Pane";
export default Pane;
</script>
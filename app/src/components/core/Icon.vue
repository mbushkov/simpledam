<template>
  <span class="icon" :class="[iconType, iconSize]">
    <i :class="['mdi', iconName, iconCustomSize]"></i>
  </span>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";
</style>

<script lang="ts">
import Icon from "./Icon";
export default Icon;
</script>
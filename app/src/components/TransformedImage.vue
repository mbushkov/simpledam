<template>
  <div class="transformed-image">
    <img
      :src="url"
      :class="{'rotated-90': isRotated90, 'rotated-180': isRotated180, 'rotated-270': isRotated270 }"
      class="image"
    />    
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.transformed-image {
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .image {
    display: block;
    max-width: 100%;
    max-height: 100%;

    &.rotated-90 {
      transform: translateY(-100%) rotate(90deg);
      transform-origin: left bottom;
    }

    &.rotated-180 {
      transform: rotate(180deg);
    }

    &.rotated-270 {
      transform: rotate(270deg) translateX(-100%);
      transform-origin: left top;
    }
  }
}
</style>
<script lang="ts">
import TransformedImage from './TransformedImage';
export default TransformedImage;
</script>
<template>
  <div class="single-image" ref="el" @dblclick.stop.prevent="doubleClicked($event)" @contextmenu.prevent="contextClicked()">
    <img
      ref="img"
      v-if="imageUrl"
      :src="imageUrl"
      :style="imageStyle"
      :class="{'rotated-90': isRotated90, 'rotated-180': isRotated180, 'rotated-270': isRotated270 }"
      class="image"
    />
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.single-image {
  overflow: auto;
  width: 100%;
  height: 100%;
  background-color: $nm-background-color-lighter;

  .image {
    display: block;
    max-width: none;
    max-height: none;

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
import SingleImage from './SingleImage';
export default SingleImage;
</script>
<template>
  <div class="progress-wrapper">
    <progress
      class="progress is-darkgrey"
      :class="size"
      :max="max"
      :value="value">{{ label }}</progress>    
    <p
      class="progress-value"><slot>{{ label }}</slot></p>      
  </div>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";
// Import Bulma's core
@import "../../styles/bulma/sass/utilities/_all";

@mixin progress-size() {
  &.is-small {
    + .progress-value,
    .progress-value {
      font-size: calc(#{$size-small} / 1.5);
      line-height: $size-small;
    }
  }
  &.is-medium {
    + .progress-value,
    .progress-value {
      font-size: calc(#{$size-medium} / 1.5);
      line-height: $size-medium;
    }
  }
  &.is-large {
    + .progress-value,
    .progress-value {
      font-size: calc(#{$size-large} / 1.5);
      line-height: $size-large;
    }
  }
}

.progress-wrapper {
  position: relative;
  overflow: hidden;

  .progress-value {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    font-size: calc(#{$size-normal} / 1.5);
    line-height: $size-normal;
    font-weight: $weight-bold;
    color: black;
    white-space: nowrap;
  }

  .progress,
  .progress-bar {
    margin-bottom: 0;

    @include progress-size();

    &::-webkit-progress-value {
      transition: width 0.5s ease;
    }
  }
}
</style>

<script lang="ts">
import Progress from "./Progress";
export default Progress;
</script>
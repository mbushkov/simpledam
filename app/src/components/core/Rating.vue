<template>
  <div
    class="rate is-disabled">
    <div
        v-for="(itemStyle, index) in rateStyles"
        class="rate-item"
        :class="itemStyle"
        :key="index">
        <Icon
            :pack="iconPack"
            :icon="icon"
            :size="size"
        />
    </div>
  </div>  
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

$rate-color: $grey-lighter !default;
$rate-color-active: darken($warning, 5%) !default;
$rate-spaced: 0.25rem !default;
$rate-text-spaced: 0.35rem !default;

.rate {
  align-items: center;
  display: flex;
  &:not(:last-child) {
    margin-bottom: ($block-spacing * 0.5);
  }
  &.is-spaced .rate-item:not(:last-child) {
    margin-right: $rate-spaced;
  }
  &.is-disabled .rate-item {
    cursor: initial;
    &:hover {
      transform: none;
    }
  }
  &.is-rtl {
    .rate-item {
      order: 1;
    }
    .rate-text {
      margin-left: 0;
      margin-right: $rate-text-spaced;
    }
  }
  .rate-item {
    cursor: pointer;
    display: inline-flex;
    position: relative;
    transition: all 0.3s;
    &:hover {
      transform: scale(1.1);
    }
    &.set-on .icon,
    &.set-half .is-half {
      color: $rate-color-active;
    }
    &.set-half .is-half {
      position: absolute;
      left: 0;
      top: 0;
      overflow: hidden;
    }
  }
  .icon {
    color: $rate-color;
    line-height: 1;
    pointer-events: none;
    width: inherit;
  }
  .is-half > i {
    position: absolute;
    left: 0;
  }
  .rate-text {
    font-size: calc(#{$size-normal} / 1.25);
    margin-left: $rate-text-spaced;
    &.is-small {
      font-size: calc(#{$size-small} / 1.25);
    }
    &.is-medium {
      font-size: calc(#{$size-medium} / 1.25);
    }
    &.is-large {
      font-size: calc(#{$size-large} / 1.25);
    }
  }
}
</style>

<script lang="ts">
import Rating from "./Rating";
export default Rating;
</script>
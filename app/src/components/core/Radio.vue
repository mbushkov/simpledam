<template>
  <label
    class="b-radio radio"
    ref="label"
    :class="[size, { 'is-disabled': disabled }]"
    @click="focus"
    @keydown.prevent.enter="($refs.label as any).click()">
    <input
        v-model="inputValue"
        type="radio"
        ref="input"
        :disabled="disabled"
        :required="required"
        :name="name"
        :value="nativeValue">
    <span class="check" :class="type" />
    <span class="control-label"><slot/></span>
  </label>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

$radio-active-background-color: $primary !default;
$radio-size: 1.25em !default;
$radio-colors: $form-colors !default;

.b-radio {
  &.radio {
    @extend %unselectable;
    cursor: default;
    outline: none;
    display: inline-flex;
    align-items: center;
    &:not(.button) {
      margin-right: 0.5em;
      & + .radio:last-child {
        margin-right: 0;
      }
    }
    // reset Bulma
    & + .radio {
      margin-left: 0;
    }
    input[type="radio"] {
      position: absolute;
      left: 0;
      opacity: 0;
      outline: none;
      z-index: -1;
      + .check {
        display: flex;
        flex-shrink: 0;
        position: relative;
        cursor: pointer;
        width: $radio-size;
        height: $radio-size;
        transition: background $speed-slow $easing;
        border-radius: 50%;
        border: 2px solid $grey;
        &:before {
          content: "";
          cursor: pointer;
          display: flex;
          position: absolute;
          left: 50%;
          margin-left: calc(-#{$radio-size} * 0.5);
          bottom: 50%;
          margin-bottom: calc(-#{$radio-size} * 0.5);
          width: $radio-size;
          height: $radio-size;
          transition: transform $speed-slow $easing;
          border-radius: 50%;
          transform: scale(0);
          background-color: $radio-active-background-color;
        }
        @each $name, $pair in $radio-colors {
          $color: nth($pair, 1);
          &.is-#{$name}:before {
            background: $color;
          }
        }
      }
      &:checked + .check {
        border-color: $radio-active-background-color;
        cursor: pointer;
        @each $name, $pair in $radio-colors {
          $color: nth($pair, 1);
          &.is-#{$name} {
            border-color: $color;
          }
        }
        &:before {
          transform: scale(0.5);
        }
      }
      &:focus {
        + .check {
          box-shadow: 0 0 0.5em rgba($grey, 0.8);
        }
        &:checked + .check {
          box-shadow: 0 0 0.5em rgba($radio-active-background-color, 0.8);
          @each $name, $pair in $radio-colors {
            $color: nth($pair, 1);
            &.is-#{$name} {
              box-shadow: 0 0 0.5em rgba($color, 0.8);
            }
          }
        }
      }
    }
    .control-label {
      padding-left: $control-padding-horizontal;
    }
    &.button {
      display: flex;

      &.is-selected {
        z-index: 1;
      }
    }
    &.is-diabled {
      opacity: 0.5;
    }
    &:hover {
      input[type="radio"]:not(:disabled) + .check {
        cursor: pointer;
        border-color: $radio-active-background-color;
        @each $name, $pair in $radio-colors {
          $color: nth($pair, 1);
          &.is-#{$name} {
            border-color: $color;
          }
        }
      }
    }
    &.is-small {
      @include control-small;
    }
    &.is-medium {
      @include control-medium;
    }
    &.is-large {
      @include control-large;
    }
  }
}
</style>

<script lang="ts">
import Radio from "./Radio";
export default Radio;
</script>
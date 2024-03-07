<template>
  <label
    class="b-checkbox checkbox"
    ref="label"
    :class="[size, { 'is-disabled': disabled }]"
    @click="focus"
    @keydown.prevent.enter="($refs.label as any).click()">
    <input
        v-model="inputValue"
        type="checkbox"
        ref="input"
        @click.stop
        :disabled="disabled === true"
        :required="required"
        :name="name"
        :value="nativeValue">
    <span class="check" :class="type" />
    <span class="control-label"><slot/></span>
  </label>
</template>

<style lang="scss" scoped>
@import "../../styles/helpers";
@import "../../styles/variables";

@function checkmark($color) {
  $start: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>";
  $content: "<path style='fill:#{$color}' d='M 0.04038059,0.6267767 0.14644661,0.52071068 0.42928932,0.80355339 0.3232233,0.90961941 z M 0.21715729,0.80355339 0.85355339,0.16715729 0.95961941,0.2732233 0.3232233,0.90961941 z'></path>";
  $end: "</svg>";

  @return svg-encode("#{$start}#{$content}#{$end}");
}

@function indeterminate($color) {
  $start: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>";
  $content: "<rect style='fill:#{$color}' width='0.7' height='0.2' x='.15' y='.4'></rect>";
  $end: "</svg>";

  @return svg-encode("#{$start}#{$content}#{$end}");
}

$checkbox-active-background-color: $primary !default;
$checkbox-background-color: transparent !default;
$checkbox-border-color: $grey !default;
$checkbox-border-radius: $radius !default;
$checkbox-border-width: 2px !default;
$checkbox-checkmark-color: $primary-invert !default;
$checkbox-size: 1.25em !default;
$checkbox-colors: $form-colors !default;

.b-checkbox {
  &.checkbox {
    @extend %unselectable;
    outline: none;
    display: inline-flex;
    align-items: center;
    &:not(.button) {
      margin-right: 0.5em;
      & + .checkbox:last-child {
        margin-right: 0;
      }
    }
    input[type="checkbox"] {
      position: absolute;
      left: 0;
      opacity: 0;
      outline: none;
      z-index: -1;
      + .check {
        width: $checkbox-size;
        height: $checkbox-size;
        flex-shrink: 0;
        border-radius: $checkbox-border-radius;
        border: $checkbox-border-width solid $checkbox-border-color;
        transition: background $speed-slow $easing;
        background: $checkbox-background-color;
      }
      &:checked + .check {
        background: $checkbox-active-background-color
          url(checkmark($checkbox-checkmark-color)) no-repeat center center;
        border-color: $checkbox-active-background-color;
        @each $name, $pair in $checkbox-colors {
          $color: nth($pair, 1);
          $color-invert: nth($pair, 2);
          &.is-#{$name} {
            background: $color
              url(checkmark($color-invert))
              no-repeat
              center
              center;
            border-color: $color;
          }
        }
      }
      &:indeterminate + .check {
        background: $checkbox-active-background-color
          url(indeterminate($checkbox-checkmark-color)) no-repeat center center;
        border-color: $checkbox-active-background-color;
        @each $name, $pair in $checkbox-colors {
          $color: nth($pair, 1);
          $color-invert: nth($pair, 2);
          &.is-#{$name} {
            background: $color
              url(indeterminate($color-invert))
              no-repeat
              center
              center;
            border-color: $color;
          }
        }
      }
      &:focus {
        + .check {
          box-shadow: 0 0 0.5em rgba($grey, 0.8);
        }
        &:checked + .check {
          box-shadow: 0 0 0.5em rgba($checkbox-active-background-color, 0.8);
          @each $name, $pair in $checkbox-colors {
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
    }
    &.is-disabled {
      opacity: 0.5;
    }
    &:hover {
      input[type="checkbox"]:not(:disabled) + .check {
        border-color: $checkbox-active-background-color;
        @each $name, $pair in $checkbox-colors {
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
import Checkbox from "./Checkbox";
export default Checkbox;
</script>
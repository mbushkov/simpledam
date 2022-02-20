<template>
  <div
    ref="host"
    draggable="true"
    class="image-box"
    :class="{ selected: isPrimarySelected, 
      'additional-selected': isAdditionalSelected, 
      'rotation-0': !(isRotated90 || isRotated180 || isRotated270), 
      'rotation-90': isRotated90, 
      'rotation-180': isRotated180, 
      'rotation-270': isRotated270 }"
    @dragstart="dragStarted($event)"
    @click="clicked($event)"
    @contextmenu="contextClicked($event)"
  >
    <div class="nested" ref="nestedRef">
      <div class="image-wrapper"  v-if="imageData.previewSize">
        <img :style="imageStyle" :src="imageData.previewUrl" />
      </div>
    </div>
    <div class="metadata">
      <div class="ib-label" v-if="!isShortVersion">
        <Icon
          :type="'is-label-' + labelNames[imageData.label]"
          icon="checkbox-blank"
          size="is-small">
        </Icon>
      </div>
      <div class="ib-rating">
        <Rating :max="5" :value="imageData.rating" size="is-small"></Rating>
      </div>
    </div>
    <div
      class="title"
      :class="{['has-text-label-' + labelNames[imageData.label]]: isShortVersion, ['short-version'] : isShortVersion}"
    >{{ filename(imageData.filePath) }}</div>
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";

.image-box {
  border: 1px solid #454545;
  position: relative;

  &.selected {
    border: 1px solid white;
  }

  &.additional-selected {
    border: 1px solid yellow;
  }

  .image-wrapper {
    // This ensures that the image is right-aligned, so that transformations with origin "right-top" work as expected.
    // With "text-align: right" the image top right corner is bound to the image-wrapper's top right corner.
    text-align: right;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
  }

  .nested {
    position: absolute;
    left: 5px;
    right: 5px;
    top: 5px;
    bottom: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;

      &.rotated-90 {
        transform: rotate(90deg);
      }

      &.rotated-180 {
        transform: rotate(180deg);
      }

      &.rotated-270 {
        transform: rotate(270deg);
      }
    }
  }

  .title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 22px;

    color: $nm-text-color;
    font-size: 13px;
    line-height: 1;
    font-weight: normal;

    display: flex;
    align-items: center;
    justify-content: center;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    &.short-version {
      font-size: 10px;
    }
  }

  .metadata {
    position: absolute;
    bottom: 22px;
    left: 0;
    right: 0;
    height: 20px;

    color: $nm-text-color;
    font-size: 13px;
    line-height: 1;
    font-weight: normal;

    display: flex;
    justify-content: center;
    align-items: flex-end;

    .ib-label {
      font-size: 14px;
      margin-right: 0.25em;
    }

    .ib-rating {
      :deep(.rate .rate-item.set-on .icon) {
        color: $nm-text-color;
      }
      :deep(.rate .icon) {
        color: $nm-background-color-lighter-tone-up;
      }
    }
  }
}
</style>

<script lang="ts">
import ImageBox from "./ImageBox";
export default ImageBox;
</script>
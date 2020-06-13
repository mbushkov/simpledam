<template>
  <div
    draggable="true"
    class="image-box"
    :class="{ selected: isPrimarySelected, 'additional-selected': isAdditionalSelected }"
    @dragstart="dragStarted($event)"
    @click="clicked($event)"
  >
    <div class="nested" ref="nestedRef">
      <div class="image-wrapper" :style="imageWrapperStyle" v-if="imageData.previewSize">
        <img :style="imageStyle" :src="'http://localhost:' + port + '/images/' + imageData.uid" />
      </div>
    </div>
    <div class="metadata">
      <div class="ib-label" v-if="!isShortVersion">
        <b-icon
          :type="{['is-label-' + labelNames[imageData.label]]: true}"
          icon="checkbox-blank"
          size="is-small"
          class="icon"
        ></b-icon>
      </div>
      <div class="ib-rating">
        <b-rate :disabled="true" :max="5" v-model="imageData.rating" size="is-small"></b-rate>
      </div>
    </div>
    <div
      class="title"
      :class="{['has-text-label-' + labelNames[imageData.label]]: isShortVersion, ['short-version'] : isShortVersion}"
    >{{ filename(imageData.filePath) }}</div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-box {
  border: 1px solid #454545;
  position: relative;

  &.selected {
    border: 1px solid white;
  }

  &.additional-selected {
    border: 1px solid yellow;
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
      ::v-deep {
        .rate .rate-item.set-on .icon {
          color: $nm-text-color;
        }
        .rate .icon {
          color: $nm-background-color-lighter-tone-up;
        }
      }
    }
  }
}
</style>

<script lang="ts">
import ImageBox from './ImageBox';
export default ImageBox;
</script>
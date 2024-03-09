<template>
  <div class="image-list-row" :style="rowStyle"
    :class="{ 'primary-selected': isPrimarySelected, 'additional-selected': isAdditionalSelected }">
    <div class="cell" v-for="column in row.columns" :key="column.name"
      :style="{ 'width': `${column.width}px`, 'min-width': `${column.width}px`, 'flex-grow': column.grow ? 1 : 0 }">
      <TransformedImage v-if="column.name === 'preview'" :url="row.previewUrl" :adjustments="row.previewAdjustments"
        class="image-row" :name="'row-box-' + row.key"></TransformedImage>
      <span v-else-if="column.name === 'label'">
        <LabelIcon :value="column.value"></LabelIcon>
      </span>
      <span v-else-if="column.name === 'rating'">
        <Rating :max="5" :value="column.value" size="is-small"></Rating>
      </span>
      <span v-else-if="column.name === 'width'">
        {{ column.value }}px
      </span>
      <span v-else-if="column.name === 'height'">
        {{ column.value }}px
      </span>
      <span v-else="column.name !== 'preview'">
        {{ column.value }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-list-row {
  display: flex;
  background-color: $nm-background-color;
  color: $nm-text-color;

  .cell.preview {
    height: 100%;

    img {
      max-width: 100%;
      max-height: 100%;
    }
  }

  &.primary-selected {
    background-color: $nm-background-color-selected;
  }

  &.additional-selected {
    background-color: $nm-background-color-selected-additional;
  }
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;

  // TODO: dirty hack
  :deep(.rate .rate-item.set-on .icon) {
    color: $nm-text-color;
  }

  :deep(.rate .icon) {
    color: $nm-background-color-lighter-tone-up;
  }
}

.scroller {
  height: 100%;
}

.drag-indicator {
  position: absolute;
  width: 3px;
  background: red;
  z-index: 100;
}
</style>

<script lang="ts">
import ImageListRow from './ImageListRow';
export default ImageListRow;
</script>
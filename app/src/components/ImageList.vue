<template>
  <div
    class="image-list"
    ref="el"
    v-show="show"
    @dragenter.prevent="containerDragEntered($event)"
    @dragleave.prevent="containerDragLeft($event)"
    @dragover.prevent="containerDraggedOver($event)"
    @dragleave="containerDragEnded()"
    @drop="containerDropped($event)"
  >
    <div class="header" :style="rowStyle">
      <div class="cell" v-for="(column, index) in headerColumns" :key="column.name" :style="{'width': `${column.width}px`, 'min-width': `${column.width}px`, 'flex-grow': column.grow ? 1 : 0}" @contextmenu="headerCellContextClicked(column, $event)">
        {{ COLUMN_TITLES[column.name] }}
        <div class="separator" v-if="index !== headerColumns.length - 1" @mousedown.prevent="separatorMouseDown(column, $event)"></div>
      </div>
    </div>
    <div class="body">
      <RecycleScroller
        ref="scroller"
        class="scroller"
        :items="currentList"
        :item-size="maxSize"
        :buffer="maxSize * 10"
        key-field="key"
      >
        <template #before>
          <div class="drag-indicator" ref="dragIndicator" :style="dragIndicatorStyle"></div>
        </template>

        <template v-slot="{ item, active }">
          <ImageListRow :maxSize="maxSize" :uid="item" class="image-list-row" draggable="true"
            @click="rowClicked(item, $event)"
            @dblclick="rowDoubleClicked(item, $event)"
            @contextmenu="rowContextClicked(item, $event)"
            @dragstart.prevent="rowDragStarted(item, $event)">
          </ImageListRow>
        </template>
      </RecycleScroller>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-list {
  background-color: $nm-background-color-lighter;
  overflow: none;
  font-size: 14px;
  display: flex;
  flex-direction: column;
}

.header {
  position: relative;
  display: flex;
  background-color: $nm-dark-color;
  color: $nm-text-color;

  .cell {
    position: relative;

    .separator {
      position: absolute;
      width: 2px;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: $nm-background-color-lighter-tone-up;
      cursor: col-resize;
    }
  }
}

.body {
  flex-grow: 1;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.scroller {
  height: 100%;
}

.drag-indicator {
  position: absolute;
  height: 3px;
  background: red;
  z-index: 100;
}
</style>

<script lang="ts">
import ImageList from './ImageList';
export default ImageList;
</script>
<template>
  <div
    class="image-grid"
    ref="el"
    v-show="show"
    @dragenter.prevent="containerDragEntered($event)"
    @dragleave.prevent="containerDragLeft($event)"
    @dragover.prevent="containerDraggedOver($event)"
    @dragleave="containerDragEnded($event)"
    @drop="containerDropped($event)"
  >
    <RecycleScroller
      ref="scroller"
      class="scroller"
      :items="uidGroups"
      :item-size="maxSize"
      :buffer="maxSize * 6"
      key-field="key"
    >
      <template #before>
        <div class="drag-indicator" ref="dragIndicator" :style="dragIndicatorStyle"></div>
      </template>

      <template v-slot="{ item, active }">
        <div class="row" style="rowStyle">
          <ImageBox
            v-for="imageData in item.imageData"
            :key="imageData.uid"
            class="image-box"
            :name="active ? ('box-' + imageData.uid) : ''"
            :style="imageBoxStyle"
            draggable="true"
            :size="maxSize"
            :imageData="imageData"
            :shortVersion="shortImageBoxVersion"
            @nm-click="imageBoxClicked"
            @nm-contextclick="imageBoxContextClicked"
            @nm-dblclick="imageBoxDoubleClicked"
            @nm-dragstart="imageBoxDragStarted"
          ></ImageBox>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-grid {
  background-color: $nm-background-color-lighter;
  overflow: auto;
}

.row {
  display: flex;
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
import ImageGrid from './ImageGrid';
export default ImageGrid;
</script>
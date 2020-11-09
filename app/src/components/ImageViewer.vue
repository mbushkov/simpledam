<template>
  <div class="image-viewer">
    <div class="mode-panel">
      <div v-if="imageFile" class="filename">{{ imageFile.path }}</div>
      <div v-if="imageFile" class="size">{{ imageFile.size.width }} x {{ imageFile.size.height }} pixels</div>
    </div>
    <ImageGrid ref="imageGridRef" class="grow" :show="currentTab === ImageViewerTab.THUMBNAILS"></ImageGrid>
    <SingleImage ref="singleImageRef" class="grow" v-if="currentTab === ImageViewerTab.MEDIA"></SingleImage>
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.image-viewer {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
  border: 1px solid black;

  .mode-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    min-height: 24px;
    color: $nm-text-color;
    font-size: 12px;
    margin-left: 2px;
    margin-right: 2px;

    .filename {
      flex-grow: 1;
      text-overflow: ellipsis;
      text-align: left;
    }

    .size {
      white-space: nowrap;
    }
  }

  .grow {
    flex-grow: 1;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(114, 114, 114, 1);
  }

  ::-webkit-scrollbar-thumb:window-inactive {
    background: rgba(114, 114, 114, 0.6);
  }
}
</style>
<script lang="ts">
import ImageViewer from './ImageViewer';
export default ImageViewer;
</script>
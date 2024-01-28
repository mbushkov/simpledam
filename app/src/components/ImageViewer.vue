<template>
  <div class="image-viewer">
    <div class="mode-panel">
      <div class="filename">{{ imageFile?.path ?? '' }}</div>
      <div v-if="imageFile" class="size">{{ imageFile.size.width }} x {{ imageFile.size.height }} pixels</div>
      <Icon class="info-icon" @click="infoIconClicked()" icon="information-outline" :type="infoIconType"></Icon>
    </div>

    <splitpane-container>
      <splitpane
        class="left-pane">
        <ImageGrid ref="imageGridRef" class="grow" :show="currentTab === ImageViewerTab.THUMBNAILS"></ImageGrid>
        <SingleImage ref="singleImageRef" class="grow" v-if="currentTab === ImageViewerTab.MEDIA"></SingleImage>
      </splitpane>
      <splitpane class="right-pane"
        v-if="infoPaneShown"
        :size="20"
        :min-size="10"
        :max-size="80">
        <InfoPane></InfoPane>
      </splitpane>
    </splitpane-container>
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.image-viewer {
  background-color: $nm-background-color;
  display: flex;
  flex-direction: column;
  border: 1px solid black;
  position: relative;

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

    .info-icon {
      cursor: pointer;
      margin-left: 0.5rem;
    }
  }

  .grow {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(114, 114, 114, 1);
  }

  ::-webkit-scrollbar-thumb:window-inactive {
    background: rgba(114, 114, 114, 0.6);
  }

  :deep(.splitpanes) {
    flex-grow: 1;

    .left-pane {
      padding-left: $splitter-size;
      min-width: 250px;
      position: relative;
    }

    .right-pane {
      padding-right: $splitter-size;
      position: relative;
    }
  }
}
</style>
<script lang="ts">
import ImageViewer from './ImageViewer';
export default ImageViewer;
</script>
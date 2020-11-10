<template>
  <div class="toolbar">
    <div class="left-pane" :style="{width: leftPaneWidth.toString() + 'px'}">
    </div>
    <div class="right-pane">
      <b-tabs class="top-tabs" size="is-small" type="is-toggle" v-model="currentTab">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>

      <b-icon icon="file-eye-outline" :class="{disabled: !selectionPresent}" @click.native="showMediaFile"></b-icon>
      <b-icon icon="file-move-outline" :class="{disabled: !selectionPresent}" @click.native="exportToFolder"></b-icon>
      <span class="separator"></span>
      <b-icon icon="rotate-left-variant" :class="{disabled: !selectionPresent}" @click.native="rotateLeft"></b-icon>
      <b-icon icon="rotate-right-variant" :class="{disabled: !selectionPresent}" @click.native="rotateRight"></b-icon>
      <b-icon icon="texture-box" :class="{disabled: !selectionPresent}" @click.native="showLabelMenu"></b-icon>
      <b-icon icon="star-box" :class="{disabled: !selectionPresent}" @click.native="showRatingMenu"></b-icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.toolbar {
  background-color: $nm-background-color;
  display: flex;
  align-items: stretch;
  align-content: stretch;

  .right-pane {
    display: flex;
    align-items: center;
    margin-left: $splitter-size;

    .top-tabs {
      margin-bottom: 0;
      margin-right: 3em;

      ::v-deep .tabs li {
        width: 80px;
        a {
          border-radius: 0;
        }
      }
      ::v-deep .tab-content {
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  }

  span.icon {
    display: block;
    color: $nm-text-color;
    position: relative;
    top: -5px;
    margin-left: .2em;
    margin-right: .2em;

    :hover {
      color: $nm-primary-color;
    }

    &.disabled {
      opacity: .5;
      :hover {
        color: $nm-text-color;
      }
    }
  }

  span.separator {
    width: .75em;
  }
}
</style>

<script lang="ts">
import ToolBar from './ToolBar';
export default ToolBar;
</script>
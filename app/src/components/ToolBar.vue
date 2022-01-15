<template>
  <div class="toolbar">
    <div class="left-pane" :style="{width: leftPaneWidth.toString() + 'px'}">
    </div>
    <div class="right-pane">
      <b-tabs class="mode-panel top-tabs" size="is-small" type="is-toggle" v-model="currentTab">
        <b-tab-item label="Thumbnails"></b-tab-item>
        <b-tab-item label="Media"></b-tab-item>
      </b-tabs>

      <Icon icon="file-eye-outline" :class="{disabled: !selectionPresent}" @click.native="showMediaFile"></Icon>
      <Icon icon="file-move-outline" :class="{disabled: !selectionPresent}" @click.native="exportToFolder"></Icon>
      <span class="separator"></span>
      <Icon icon="rotate-left-variant" :class="{disabled: !selectionPresent}" @click.native="rotateLeft"></Icon>
      <Icon icon="rotate-right-variant" :class="{disabled: !selectionPresent}" @click.native="rotateRight"></Icon>
      <Icon icon="texture-box" :class="{disabled: !selectionPresent}" @click.native="showLabelMenu"></Icon>
      <Icon icon="star-box" :class="{disabled: !selectionPresent}" @click.native="showRatingMenu"></Icon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";

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
    margin-left: 0.2em;
    margin-right: 0.2em;

    :hover {
      color: $nm-primary-color;
    }

    &.disabled {
      opacity: 0.5;
      :hover {
        color: $nm-text-color;
      }
    }
  }

  span.separator {
    width: 0.75em;
  }
}
</style>

<script lang="ts">
import ToolBar from "./ToolBar";
export default ToolBar;
</script>
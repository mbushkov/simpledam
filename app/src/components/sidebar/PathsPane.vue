<template>
  <Pane title="Paths">
    <div class="paths">
      <div
        class="row"
        v-for="entry in entries"
        :key="entry.path"
        :class="{'drag-highlighted': highlights[entry.path]}"
      >
        <div class="path-name">
          <span class="path-title">{{ entry.path }}</span>
        </div>
        <div class="path-count">
          <span class="count">{{ entry.count }}</span>
          <Radio
            size="is-small"
            type="is-path-selected"
            native-value="true"
            v-model="entry.selected"
            v-on:click.native.prevent="pathClicked(entry, $event)"
          ></Radio>
        </div>
      </div>
    </div>
  </Pane>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

.paths {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 3px;
    margin-bottom: 3px;

    &.drag-highlighted {
      background-color: $nm-background-color-selected;
      color: $nm-text-color-selected !important;
    }

    .path-name {
      display: flex;
      align-items: center;
      overflow: hidden;
      width: 100%;
      padding-right: 1em;
      color: $nm-text-color;

      span.path-title {
        font-size: 13px;
        width: 100%;
        overflow: hidden;
        text-align: left;
        line-height: 100%;
        overflow-wrap: break-word;
      }
    }

    .path-count {
      display: flex;
      align-items: center;
      color: $nm-text-color;
      font-size: 13px;

      span.count {
        margin-right: 0.5em;
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>

<script lang="ts">
import PathsPane from "./PathsPane";
export default PathsPane;
</script>
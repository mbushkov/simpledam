<template>
  <Pane title="Label">
    <div class="labels">
      <div class="row" v-for="entry in entries" :key="entry.title">
        <div class="label-name">
          <Icon :type="'is-label-' + entry.title" icon="checkbox-blank"></Icon>
          <span
            class="label-title"
          >{{ entry.title[0].toUpperCase() + entry.title.slice(1) }} [{{ entry.keyStroke }}]</span>
        </div>
        <div class="label-count">
          <span class="count">{{ counts[entry.label] }}</span>
          <Radio
            size="is-small"
            type="is-label-selected"
            native-value="true"
            v-model="entry.selected"
            v-on:click.native.prevent="labelClicked(entry, $event)"
          ></Radio>
        </div>
      </div>
    </div>
  </Pane>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

.labels {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .label-name {
      display: flex;
      align-items: center;
      color: $nm-text-color;
      font-size: 13px;

      span.label-title {
        position: relative;
        top: 1px;
      }
    }

    .label-count {
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
import LabelsPane from "./LabelsPane";
export default LabelsPane;
</script>
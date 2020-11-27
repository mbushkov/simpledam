<template>
  <div class="status-bar">
    <div>{{ backendState.catalogPath }}</div>
    <div
      v-if="backendState.previewQueueSize > 0"
    >{{ backendState.previewQueueSize }} previews pending</div>

    <div class="long-operations">
      <div v-for="(item, key) in transientStoreState.longOperations" :key="key" class="operation">
        <div class="status">{{item.status}}</div>
        <div class="progress"> <b-progress :value="item.progress" :max="100" format="percent" show-value size="is-small"></b-progress></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';
.status-bar {
  background-color: $nm-background-color;
  color: $nm-text-color;
  font-size: 13px;

  display: flex;
  align-items: center;

  > div {
    margin-right: 1em;
  }

  .long-operations {
    position: absolute;
    margin-right: 0;
    bottom: 0;
    right: $splitter-size;
    max-width: 600px;
    background-color: $nm-background-color;
    border: 1px solid black;

    padding-left: 5px;
    padding-right: 5px;

    .operation {
      height: 19px;
      display: flex;
      align-items: center;

      .status {
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        padding-right: 5px;
      }

      .progress {
        padding-left: 5px;
        padding-top: 1px;
        width: 75px;
      }
    }
  }
}
</style>

<script lang="ts">
import StatusBar from './StatusBar';
export default StatusBar;
</script>
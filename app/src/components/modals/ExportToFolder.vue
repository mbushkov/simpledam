<template>
  <div class="export-to-folder">
    <div class="top">
      Export Selection To Folder
    </div>

    <div class="content">
      <div class="destination-path">
        <div class="path">{{ destinationPath || noneConstant }}</div>
        <button class="button is-light is-small" @click="openFolderDialog">Browse Folder</button>
      </div>
      
      <div>
        <b-checkbox v-model="prefixWithIndex">Prefix filenames with index</b-checkbox>
      </div>
    </div>

    <div class="bottom">
      <button class="button is-light is-small" @click="$emit('close')">Close</button>
      <button class="button is-primary is-small" :disabled="!destinationPath" @click="startExport">Export</button>
    </div>
</div>
</template>

<style lang="scss" scoped>
@import '../../styles/variables';

.export-to-folder {
  background-color: $nm-background-color-lighter;
  border: 1px solid $nm-primary-color;
  color: $nm-text-color;
  font-size: 13px;

  .top {
    background-color: $nm-dark-color;
    color: $nm-text-color-light;
    font-weight: 700;
    padding-left: 1em;
    padding-right: 1em;
    padding-top: .25em;
    padding-bottom: .25em;
  }

  .content {
    padding-left: 1em;
    padding-right: 1em;
    padding-top: 1em;
    margin: 0;

    .destination-path {
      display: flex;
      align-content: center;

      .path {
        flex-grow: 1;
      }

      button {
        padding-left: 1em;
      }
    }
  }

  .bottom {
    display: flex;
    justify-content: flex-end;
    align-content: center;

    padding: 1em;

    button {
      min-width: 80px;
      margin-left: 1.5em;
    }
  }
}
</style>

<script lang="ts">
import ExportToFolder from './ExportToFolder';
export default ExportToFolder;
</script>
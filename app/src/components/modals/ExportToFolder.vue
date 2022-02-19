<template>
  <div class="export-to-folder">
    <div class="top">
      Export Selection To Folder
    </div>

    <div class="content">
      <div class="destination-path">
        <div class="path"><span v-if="destinationPath">{{ destinationPath }}</span><span v-if="!destinationPath"><em>{{ noneConstant }}</em></span></div>
        <button class="button is-light is-small" :disabled="inProgress" @click="openFolderDialog">Select Folder</button>
      </div>

      <hr>
      
      <div>
        <NmCheckbox :disabled="inProgress" v-model="prefixWithIndex">Prefix filenames with index</NmCheckbox>
      </div>
    </div>

    <div class="bottom">
      <NmProgress v-if="inProgress" class="progress"></NmProgress>
      <button class="button is-light is-small" :disabled="inProgress" @click="$emit('close')">Close</button>
      <button class="button is-primary is-small" :disabled="inProgress || !destinationPath" @click="startExport">Export</button>
    </div>
</div>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

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
    padding-top: 0.25em;
    padding-bottom: 0.25em;
  }

  .content {
    padding-left: 1em;
    padding-right: 1em;
    padding-top: 1em;
    margin: 0;

    hr {
      height: 1px;
    }

    .destination-path {
      display: flex;
      align-content: center;
      margin-bottom: 1em;

      .path {
        flex-grow: 1;
        display: flex;
        align-items: center;
        word-break: break-word;
        margin-right: 1em;
      }

      button {
        padding-left: 1em;
      }
    }
  }

  .bottom {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    padding: 1em;

    .progress {
      width: 100%;
      padding-right: 1em;
      margin-bottom: 0;
    }

    button {
      min-width: 80px;
      margin-left: 1.5em;
    }
  }
}
</style>

<script lang="ts">
import ExportToFolder from "./ExportToFolder";
export default ExportToFolder;
</script>
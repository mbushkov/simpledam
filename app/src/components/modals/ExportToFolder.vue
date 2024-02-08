<template>
  <VueFinalModal :esc-to-close="true" :focus-trap="true" :lock-scroll="true" :fit-parent="true" v-slot="{ close }" class="modal-container" :content-class="'export-to-folder'">
    <!-- TODO: dirty - this all should be encapsulated in an independent component. -->
    <div class="top" :set="closeFn = close">
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
      <button class="button is-light is-small" :disabled="inProgress" @click="close()">Close</button>
      <button class="button is-primary is-small" :disabled="inProgress || !destinationPath" @click="startExport">Export</button>
    </div>
  </VueFinalModal>
</template>

<style lang="scss">
@import "../../styles/variables";

.modal-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
}

.export-to-folder {
  &:focus {
    outline: none;
  }

  width: 80%;
  max-width: 800px;
  min-width: 500px;

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
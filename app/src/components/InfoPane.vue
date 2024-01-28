<template>
  <div class="info-pane">
    <table v-if="selectedImageData !== undefined">
      <tr class="section">
        <td colspan="2">
          File
        </td>
      </tr>
      <tr>
        <td>File Path</td>
        <td>{{ selectedImageData.path }}</td>
      </tr>
      <tr>
        <td>File Size</td>
        <td>{{  selectedImageData.file_size }}</td>
      </tr>
      <tr>
        <td>Created</td>
        <td>{{ formatDate(selectedImageData.file_ctime) }}</td>
      </tr>
      <tr>
        <td>Modified</td>
        <td>{{ formatDate(selectedImageData.file_mtime) }}</td>
      </tr>
      <tr>
        <td>Image Size</td>
        <td>{{ selectedImageData.size.width }}x{{ selectedImageData.size.height }}px</td>
      </tr>
    </table>

    <span v-if="selectedImageData === undefined">
      No image selected.
    </span>
  </div>
</template>

<style lang="scss" scoped>
@import "../styles/variables";
.info-pane {
  background-color: black;
  width: 100%;
  height: 100%;

  color: $nm-text-color;
  font-size: 13px;

  text-align: left;
  
  table {
    :nth-child(n+1) {
      margin-top: 1em;
    }

    width: 100%;
    tr {
      border: 1px solid $nm-text-color-light;
      border: 1px solid $nm-text-color-light;
      background-color: $nm-background-color;
      &.section {
        background-color: $nm-dark-color;
        font-weight: bold;
      }
    }
    td:nth-child(1) {
      border-right: 1px solid $nm-text-color-light;
      white-space: nowrap;
    }
    td:nth-child(2) {
      border-right: 1px solid $nm-text-color-light;
      width: 100%;
    }
    td {
      padding: 4px;
    }
  }
}
</style>

<script lang="ts">
import InfoPane from "./InfoPane";
export default InfoPane;
</script>
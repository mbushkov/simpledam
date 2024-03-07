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
        <td>{{ selectedImageData.file_size }}</td>
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
        <td>Mime Type</td>
        <td>{{ selectedImageData.mime_type }}</td>
      </tr>
      <tr>
        <td>Image Size</td>
        <td>{{ selectedImageData.size.width }}x{{ selectedImageData.size.height }}px</td>
      </tr>
      <tr>
        <td>ICC Color Profile</td>
        <td>{{ selectedImageData.icc_profile_description || '-' }}</td>
      </tr>
      <tr class="section" v-if="selectedExifData.length > 0">
        <td colspan="2">
          EXIF
        </td>
      </tr>
      <tr v-for="[key, value] in selectedExifData" :key="key">
        <td>{{ key }}</td>
        <td>{{ value }}</td>
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
  overflow-x: hidden;
  overflow-y: scroll;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;

  table {
    :nth-child(n+1) {
      margin-top: 1em;
    }

    width: 100%;

    tr {
      border: 1px solid $nm-text-color-light;
      background-color: $nm-background-color;

      &.section {
        background-color: $nm-dark-color;
        font-weight: bold;
        border-top: none;
        border-left: none;
        border-right: none;
      }

      &.section:nth-child(n+2) td {
        padding-top: 1em;
      }

      td:nth-child(1) {
        border-right: none;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      td:nth-child(2) {
        border-right: 1px solid $nm-text-color-light;
        width: 100%;
      }

      td {
        padding: 4px;
        overflow-wrap: anywhere;
      }
    }
  }
}
</style>

<script lang="ts">
import InfoPane from "./InfoPane";
export default InfoPane;
</script>
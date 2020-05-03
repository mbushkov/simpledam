<template>
  <div>
    <div>Images ({{ imageList.length }}):</div>

    <div class="container">
      <div v-for="image in imageList" 
        class="image-box" 

        :key="`${image.uid}|${image.preview_timestamp}`" 
        v-bind:class="{ selected: image.uid === primarySelectedUid }"
        v-bind:style="imageBoxStyle" 

        v-on:click="clicked(image.uid)">
        <div class="nested">
          <img v-if="image.preview_timestamp"
            :src="'http://127.0.0.1:30000/images/' + image.uid"
          />
        </div>
        <div class="title">
          {{ image.path | filename }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API_SERVICE } from '@/api';
import { ImageFile, STORE } from '@/store'; // eslint-disable-line no-unused-vars

const ImageGrid = Vue.extend({
  data() {
    return {
      maxSize: 300,
    }
  },

  filters: {
    filename(value: string) {
      const components = value.split('/');
      return components[components.length - 1];
    }
  },

  mounted() {
    API_SERVICE.fetchRoot();
  },

  computed: {
    imageBoxStyle(): {[key: string]: string} {
      return {
        'width': `${this.maxSize}px`,
        'height': `${this.maxSize}px`,
      };
    },

    imageList() {
      const cl = STORE.currentList();
      return cl.items.map(uid => STORE.state.images[uid]);
    },

    primarySelectedUid() {
      return STORE.state.selection.primary;
    }
  },

  methods: {
    clicked(uid: string) {
      STORE.selectPrimary(uid);
    }
  }
});


export default ImageGrid;
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .image-box.selected {
    background-color: gray;
  }

  .image-box {
    position: relative;

    .nested {
      position: absolute;
      left: 5px;
      right: 5px;
      top: 5px;
      bottom: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      
      img {
        display: block;
        max-width: 100%;
        max-height: 100%;
      }
    }

    .title {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
    }
  }
}
</style>

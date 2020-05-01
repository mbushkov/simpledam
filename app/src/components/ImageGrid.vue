<template>
  <div>
    <div>Images:</div>
    <div v-for="image in imageList" :key="image.uid">
      <img :src="'http://127.0.0.1:30000/images/' + image.uid" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API_SERVICE } from '@/api';
import { ImageFile, STORE } from '@/store'; // eslint-disable-line no-unused-vars

const ImageGrid = Vue.extend({
  mounted() {
    API_SERVICE.fetchRoot();    
  },

  computed: {
    imageList() {
      const s = STORE.state;
      const newList = [];
        for (let key in s.images) {
          newList.push(s.images[key]);
        }
        newList.sort((a: ImageFile, b: ImageFile) => {
          return a.uid.localeCompare(b.uid);
        });
        return newList;
    }
  },
});


export default ImageGrid;
</script>

<style scoped>
</style>

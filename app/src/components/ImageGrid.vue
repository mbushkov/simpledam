<template>
  <div>
    <div>Images ({{ imageList.length }}):</div>

    <div class="container">
      <div v-for="image in imageList" ref="boxes"
        class="image-box" 

        :key="`${image.uid}|${image.file.preview_timestamp}`" 
        v-bind:class="{ selected: image.uid === primarySelectedUid }"
        v-bind:style="imageBoxStyle" 

        v-on:dragstart="dragStarted(image.uid, $event)"
        v-on:click="clicked(image.uid)">
        <div class="nested">
          <img v-if="image.file.preview_timestamp"
            :src="'http://127.0.0.1:30000/images/' + image.uid"
          />
        </div>
        <div class="title">
          {{ image.file.path | filename }} {{ image.metadata.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { API_SERVICE } from '@/api';
import { ImageFile, STORE, Label, Direction, ImageMetadata } from '@/store'; // eslint-disable-line no-unused-vars

// Otherwise it will try to import it from Webpack or whatever you use.
// https://github.com/electron/electron/issues/7300
const { ipcRenderer } = window.require("electron");

const LABELS_MAP: {[key: string]: Label} = {
  '0': Label.NONE,
  '1': Label.RED,
  '2': Label.GREEN,
  '3': Label.BLUE,
  '4': Label.BROWN,
  '5': Label.MAGENTA,
  '6': Label.ORANGE,
  '7': Label.YELLOW,
  '8': Label.CYAN,
  '9': Label.GRAY,
};

declare interface Item {
  uid: string;
  file: ImageFile;
  metadata: ImageMetadata;
}

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

    window.addEventListener('keydown', this.keyPressed);
    window.addEventListener('resize', this.handleResize)

    this.handleResize();
  },

  beforeDestroy: function () {
    window.removeEventListener('keydown', this.keyPressed)
    window.removeEventListener('resize', this.handleResize)
  },

  computed: {
    imageBoxStyle(): {[key: string]: string} {
      return {
        'width': `${this.maxSize}px`,
        'height': `${this.maxSize}px`,
      };
    },

    imageList(): Item[] {
      const cl = STORE.currentList();
      return cl.items.map(uid => ({
        uid,
        file: STORE.state.images[uid],
        metadata: STORE.state.metadata[uid],
      }));
    },

    primarySelectedUid() {
      return STORE.state.selection.primary;
    }
  },

  methods: {
    clicked(uid: string) {
      STORE.selectPrimary(uid);
    },

    keyPressed(event: KeyboardEvent) {
      const label = LABELS_MAP[event.key];
      if (label !== undefined) {
        STORE.labelSelection(label);
        return;
      }

      if (event.key === 'p') {
        STORE.toggleLabelFilter(Label.RED);
      }

      if (event.keyCode === 39) {
        STORE.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 37) {
        STORE.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 38) {
        STORE.movePrimarySelection(Direction.UP);
        event.preventDefault();
        return;
      } else if (event.keyCode === 40) {
        STORE.movePrimarySelection(Direction.DOWN);
        event.preventDefault();
        return;
      }
    },

    dragStarted(uid:string, event: DragEvent) {
      event.preventDefault();
      ipcRenderer.send('ondragstart', STORE.state.images[uid].path, API_SERVICE.thumbnailUrl(uid));
    },

    handleResize: function() {
      STORE.updateColumnCount(Math.floor(this.$el.clientWidth / this.maxSize));
    },
  },

  watch: {
    primarySelectedUid(v?:string) {
      if (v !== undefined) {
        const index = STORE.currentList().items.indexOf(v);
        const ref = this.$refs['boxes'][index];
        ref.scrollIntoViewIfNeeded();
      }
    }
  },
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

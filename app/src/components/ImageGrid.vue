<template>
  <div
    class="host"
    @dragenter.prevent="containerDragEntered($event)"
    @dragover.prevent="containerDraggedOver($event)"
    @dragleave="containerDragEnded($event)"
    @drop="containerDropped($event)"
  >
    <!-- <div>Images ({{ imageList.length }}):</div> -->

    <div class="drag-indicator" ref="dragIndicator" v-bind:style="dragIndicatorStyle"></div>

    <div class="container" ref="container">
      <div
        draggable="true"
        v-for="image in imageList"
        :id="'box-' + image.uid"
        class="image-box"
        :key="`${image.uid}|${image.file.preview_timestamp}`"
        v-bind:class="{ selected: image.uid === primarySelectedUid, 'additional-selected': !!additionalSelectedUids[image.uid] }"
        v-bind:style="imageBoxStyle"
        v-on:dragstart="dragStarted(image.uid, $event)"
        v-on:click="clicked(image.uid, $event)"
      >
        <div class="nested">
          <img
            v-if="image.file.preview_timestamp"
            :src="'http://127.0.0.1:' + port + '/images/' + image.uid"
          />
        </div>
        <div class="title">{{ image.file.path | filename }} {{ image.metadata.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../styles/variables';
.host {
  overflow: scroll;
  background-color: #454545;
}

.drag-indicator {
  position: absolute;
  width: 3px;
  background: red;
  z-index: 100;
}

.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .image-box {
    position: relative;

    border: 1px solid #454545;

    &.selected {
      border: 1px solid white;
    }

    &.additional-selected {
      border: 1px solid yellow;
    }

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

      color: $nm-text-color;
      font-size: 13px;
      line-height: 1;
      font-weight: normal;
    }
  }
}
</style>

<script lang="ts">
import Vue from 'vue';
import { API_SERVICE, PORT } from '@/api';
import { ImageFile, STORE, Label, Direction, ImageMetadata } from '@/store'; // eslint-disable-line no-unused-vars

// Otherwise it will try to import it from Webpack or whatever you use.
// https://github.com/electron/electron/issues/7300
const { ipcRenderer } = window.require("electron");

const LABELS_MAP: { [key: string]: Label } = {
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
      dragIndicatorVisible: false,
      dragIndicatorIndex: 0,
      maxSize: 300,
      port: PORT.toString(),
    }
  },

  filters: {
    filename(value: string) {
      const components = value.split('/');
      return components[components.length - 1];
    }
  },

  mounted() {
    window.addEventListener('keydown', this.keyPressed);
    window.addEventListener('resize', this.handleResize)

    this.handleResize();
  },

  beforeDestroy: function () {
    window.removeEventListener('keydown', this.keyPressed)
    window.removeEventListener('resize', this.handleResize)
  },

  computed: {
    dragIndicatorStyle(): { [key: string]: string } {
      return {
        'display': this.dragIndicatorVisible ? 'block' : 'none',
        'height': `${this.maxSize}px`,
      };
    },

    imageBoxStyle(): { [key: string]: string } {
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
    },

    additionalSelectedUids() {
      return STORE.state.selection.additional;
    },

    lastTouchedUid() {
      return STORE.state.selection.lastTouched;
    }
  },

  methods: {
    containerDragEntered() {
      // for (let i = 0; i < event.dataTransfer.files.length; ++i) {
      //   console.log(['drag enter', event.dataTransfer.files.item(i).path, event.dataTransfer.files.item(i).type]);
      // }
    },

    containerDraggedOver(event: DragEvent) {
      const container = this.$refs['container'] as HTMLElement;
      const rect = container.getBoundingClientRect();
      const relX = event.pageX - rect.x;
      const relY = event.pageY - rect.y;

      const offX = Number(Math.min(Math.floor(relX / this.maxSize), STORE.state.columnCount + 1));
      const offY = Number(Math.floor(relY / this.maxSize));
      this.dragIndicatorIndex = offY * STORE.state.columnCount + offX;

      const destX = offX * this.maxSize;
      const destY = offY * this.maxSize;

      this.dragIndicatorVisible = true;
      const indicatorRef = this.$refs['dragIndicator'];
      indicatorRef.style.left = `${destX}px`;
      indicatorRef.style.top = `${destY}px`;
      indicatorRef.scrollIntoViewIfNeeded();
      // console.log(['drag over', relX, relY, indicatorRef]);
    },

    containerDragEnded() {
      console.log(['drag end']);
      this.dragIndicatorVisible = false;
    },

    containerDropped(event: DragEvent) {
      this.dragIndicatorVisible = false;
      console.log(['drop', event]);

      if (event.dataTransfer?.getData('nmUids')) {
        const nmUids = JSON.parse(event.dataTransfer.getData('nmUids'));
        console.log('moving', nmUids, this.dragIndicatorIndex);
        STORE.moveWithinCurrentList(nmUids, this.dragIndicatorIndex);
        return;
      }

      if (!event?.dataTransfer?.files) {
        return;
      }

      for (let i = 0; i < event.dataTransfer.files.length; ++i) {
        API_SERVICE.scanPath(event.dataTransfer.files.item(i)!.path);
      }
    },

    clicked(uid: string, event: MouseEvent) {
      if (event.metaKey) {
        STORE.toggleAdditionalSelection(uid);
      } else if (event.shiftKey) {
        STORE.selectRange(uid);
      } else {
        console.log(['CLICK PRIMARY', uid]);
        STORE.selectPrimary(uid);
      }
    },

    keyPressed(event: KeyboardEvent) {
      const label = LABELS_MAP[event.key];
      if (label !== undefined) {
        STORE.labelSelection(label);
        return;
      }

      if (event.keyCode === 39) {
        if (event.shiftKey) {
          STORE.moveAdditionalSelection(Direction.RIGHT);
        } else {
          STORE.movePrimarySelection(Direction.RIGHT);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 37) {
        if (event.shiftKey) {
          STORE.moveAdditionalSelection(Direction.LEFT);
        } else {
          STORE.movePrimarySelection(Direction.LEFT);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 38) {
        if (event.shiftKey) {
          STORE.moveAdditionalSelection(Direction.UP);
        } else {
          STORE.movePrimarySelection(Direction.UP);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 40) {
        if (event.shiftKey) {
          STORE.moveAdditionalSelection(Direction.DOWN);
        } else {
          STORE.movePrimarySelection(Direction.DOWN);
        }
        event.preventDefault();
        return;
      }
    },

    // https://www.html5rocks.com/en/tutorials/dnd/basics/#toc-dnd-files
    // https://thecssninja.com/demo/gmail_dragout/
    dragStarted(uid: string, event: DragEvent) {
      if (!event.dataTransfer) {
        return;
      }

      const uids = new Set<string>([uid]);
      if (STORE.state.selection.primary) {
        uids.add(STORE.state.selection.primary);
      }
      for (const additionalUid in STORE.state.selection.additional) {
        uids.add(additionalUid);
      }
      const paths = Array.from(uids).map(u => STORE.state.images[u].path);
      event.dataTransfer.setData('nmUids', JSON.stringify(Array.from(uids)));

      // TODO: enable later to display number of images being dragged.
      // const dragIcon = document.createElement('div');
      // document.body.appendChild(dragIcon);
      // dragIcon.style.width = '100px';
      // dragIcon.style.height = '100px';
      // dragIcon.textContent = 'blah';
      // dragIcon.style.backgroundColor = 'red';
      // event.dataTransfer.setDragImage(dragIcon, -10, -10);
      // setTimeout(() => document.body.removeChild(dragIcon), 0);

      ipcRenderer.once('ondragstart-confirmed', () => {
        if (!event.dataTransfer) {
          return;
        }
        console.log(['drag start', uid, STORE.state.images[uid].path]);

        event.dataTransfer.effectAllowed = 'move';
      });
      ipcRenderer.send('ondragstart', paths, API_SERVICE.thumbnailUrl(uid));

      // event.dataTransfer.setData("uid", uid);
      // event.dataTransfer.setData("DownloadURL", API_SERVICE.thumbnailUrl(uid));

    },

    handleResize: function () {
      STORE.updateColumnCount(Math.floor(this.$el.clientWidth / this.maxSize));
    },

    scrollIntoView: function (uid: string) {
      const container: HTMLDivElement = this.$refs['container'];
      const res: any = container.querySelector(`#box-${uid}`);
      res.scrollIntoViewIfNeeded();
      // const index = STORE.currentList().items.indexOf(uid);
      // const ref = this.$refs['boxes'][index];
      // ref.scrollIntoViewIfNeeded();
    }
  },

  watch: {
    lastTouchedUid(v?: string) {
      if (v !== undefined) {
        this.scrollIntoView(v);
      }
    },
  },
});


export default ImageGrid;
</script>


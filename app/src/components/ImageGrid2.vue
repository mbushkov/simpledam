<template>
  <div class="host" ref="el" @dragenter.prevent @dragover.prevent @drop="containerDropped($event)">
    <RecycleScroller
      class="scroller"
      :items="uidGroups"
      :item-size="maxSize"
      :buffer="maxSize * 6"
      key-field="key"
      v-slot="{ item }"
    >
      <div class="row" style="rowStyle">
        <ImageBox
          class="image-box"
          :style="imageBoxStyle"
          draggable="true"
          v-for="imageData in generateImageData(item.uids)"
          :key="imageData.uid"
          :imageData="imageData"
        ></ImageBox>
      </div>
    </RecycleScroller>
  </div>
</template>

<style lang="scss" scoped>
.host {
  overflow: scroll;
  background-color: #454545;
}

.row {
  display: flex;
}

.scroller {
  height: 100%;
}
</style>

<script lang="ts">
import { defineComponent, computed, onMounted, onBeforeUnmount, ref } from '@vue/composition-api';
import { STORE } from '@/store';
import { API_SERVICE } from '../api';
import { ImageData } from './ImageBox.vue';

interface Row {
  key: string;
  uids: string[];
}

export default defineComponent({
  setup() {
    const el = ref<HTMLElement>(null);

    function handleResize() {
      STORE.updateColumnCount(Math.floor(el.value.clientWidth / maxSize.value));
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      handleResize();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize)
    });

    const uidGroups = computed(() => {
      const cl = STORE.currentList();

      const result: Row[] = [];
      let cur = [];
      for (const uid of cl.items) {
        cur.push(uid);
        if (cur.length === STORE.state.columnCount) {
          result.push({
            key: cur.join('|'),
            uids: cur,
          });
          cur = [];
        }
      }

      if (cur.length > 0) {
        result.push({
          key: cur.join('|'),
          uids: cur,
        });
      }

      return result;
    });

    const imageBoxStyle = computed(() => ({
      'width': `${maxSize.value}px`,
      'height': `${maxSize.value}px`,
    }));

    const rowStyle = computed(() => ({
      'height': `${maxSize.value}px`,
    }));


    const maxSize = ref(300);

    function containerDropped(event: DragEvent) {
      // this.dragIndicatorVisible = false;
      console.log(['drop', event]);

      // if (event.dataTransfer?.getData('nmUids')) {
      //   const nmUids = JSON.parse(event.dataTransfer.getData('nmUids'));
      //   console.log('moving', nmUids, this.dragIndicatorIndex);
      //   STORE.moveWithinCurrentList(nmUids, this.dragIndicatorIndex);
      //   return;
      // }

      if (!event?.dataTransfer?.files) {
        return;
      }

      for (let i = 0; i < event.dataTransfer.files.length; ++i) {
        API_SERVICE.scanPath(event.dataTransfer.files.item(i)!.path);
      }
    }

    function generateImageData(uids: string[]): ImageData[] {
      return uids.map(uid => {
        const im = STORE.state.images[uid];
        const mdata = STORE.state.metadata[uid];
        return {
          uid,
          filePath: im.path,
          hasPreview: !!im.preview_timestamp,
          label: mdata.label,
        };
      });
    }

    return {
      el,

      maxSize,
      uidGroups,
      imageBoxStyle,
      rowStyle,

      handleResize,
      containerDropped,
      generateImageData,
    };
  }
});
</script>
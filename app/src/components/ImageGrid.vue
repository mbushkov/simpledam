<template>
  <div
    class="image-grid"
    ref="el"
    @dragenter.prevent="containerDragEntered($event)"
    @dragleave.prevent="containerDragLeft($event)"
    @dragover.prevent="containerDraggedOver($event)"
    @dragleave="containerDragEnded($event)"
    @drop="containerDropped($event)"
  >
    <RecycleScroller
      ref="scroller"
      class="scroller"
      :items="uidGroups"
      :item-size="maxSize"
      :buffer="maxSize * 6"
      key-field="key"
    >
      <template #before>
        <div class="drag-indicator" ref="dragIndicator" :style="dragIndicatorStyle"></div>
      </template>

      <template v-slot="{ item, active }">
        <div class="row" style="rowStyle">
          <ImageBox
            v-for="imageData in item.imageData"
            :key="imageData.uid"
            class="image-box"
            :name="active ? ('box-' + imageData.uid) : ''"
            :style="imageBoxStyle"
            draggable="true"
            :size="maxSize"
            :imageData="imageData"
            :shortVersion="shortImageBoxVersion"
            @nm-click="imageBoxClicked"
            @nm-dblclick="imageBoxDoubleClicked"
            @nm-dragstart="imageBoxDragStarted"
          ></ImageBox>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-grid {
  background-color: $nm-background-color-lighter;
  overflow: auto;
}

.row {
  display: flex;
}

.scroller {
  height: 100%;
}

.drag-indicator {
  position: absolute;
  width: 3px;
  background: red;
  z-index: 100;
}
</style>

<script lang="ts">
import { defineComponent, computed, onMounted, onBeforeUnmount, ref, watchEffect } from '@vue/composition-api';
import { storeSingleton, transientStoreSingleton, Direction, ImageViewerTab } from '@/store';
import { apiServiceSingleton, PORT } from '@/backend/api';
import { ImageData, SelectionType } from './ImageBox';
import ImageBox from './ImageBox.vue';
import { Label } from '@/store/schema';
import * as log from 'loglevel';
import { DRAG_HELPER_SERVICE } from '../lib/drag-helper-service';

interface Row {
  key: string;
  imageData: ImageData[];
}

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

export default defineComponent({
  components: {
    ImageBox,
  },
  setup() {
    const store = storeSingleton();
    const transientStore = transientStoreSingleton();
    const apiService = apiServiceSingleton();

    const el = ref<HTMLElement>();
    const scroller = ref<HTMLElement>();
    const dragIndicator = ref<HTMLDivElement>();

    const dragIndicatorVisible = ref(false);
    const dragIndicatorIndex = ref(0);
    const maxSize = computed(() => store.state.thumbnailSettings.size);

    function handleResize() {
      if (!el.value) {
        return;
      }
      transientStore.setColumnCount(Math.max(1, Math.floor(el.value.clientWidth / maxSize.value)));
    }
    watchEffect(handleResize);

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      window.addEventListener('keydown', keyPressed);

      handleResize();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', keyPressed)
      window.removeEventListener('resize', handleResize)
    });

    const uidGroups = computed(() => {
      const cl = store.currentList();

      const result: Row[] = [];
      let cur = [];
      for (const uid of cl.items) {
        cur.push(uid);
        if (cur.length === transientStore.state.columnCount) {
          result.push({
            key: cur.join('|'),
            imageData: generateImageData(cur),
          });
          cur = [];
        }
      }

      if (cur.length > 0) {
        result.push({
          key: cur.join('|'),
          imageData: generateImageData(cur),
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

    const dragIndicatorStyle = computed(() => {
      return {
        'display': dragIndicatorVisible.value ? 'block' : 'none',
        'height': `${maxSize.value}px`,
      };
    });

    const shortImageBoxVersion = computed(() => {
      return store.state.thumbnailSettings.size <= 120;
    });

    function containerDropped(event: DragEvent) {
      dragIndicatorVisible.value = false;

      const result = DRAG_HELPER_SERVICE.finishDrag(event);
      if (!result) {
        return;
      }

      if (result.contents.kind === 'internal') {
        store.moveWithinCurrentList(result.contents.uids, dragIndicatorIndex.value);
      } else {
        for (const p of result.contents.paths) {
          apiService.scanPath(p);
        }
      }
    }

    function containerDraggedOver(event: DragEvent) {
      const el = (scroller.value! as any).$el as HTMLElement;
      const rect = el.getBoundingClientRect();
      const relX = el.scrollLeft + event.pageX - rect.x;
      const relY = el.scrollTop + event.pageY - rect.y;

      const offX = Number(Math.min(Math.floor(relX / maxSize.value), transientStore.state.columnCount + 1));
      const offY = Number(Math.floor(relY / maxSize.value));
      dragIndicatorIndex.value = offY * transientStore.state.columnCount + offX;

      const destX = offX * maxSize.value;
      const destY = offY * maxSize.value;

      dragIndicatorVisible.value = true;
      dragIndicator.value!.style.left = `${destX}px`;
      dragIndicator.value!.style.top = `${destY}px`;
      (dragIndicator.value as any).scrollIntoViewIfNeeded();
    }

    function containerDragEnded() {
      dragIndicatorVisible.value = false;
    }

    function containerDragEntered(event: DragEvent) {
      log.info('[ImageGrid] Drag entered:', event.dataTransfer?.dropEffect);
    }

    function containerDragLeft(event: DragEvent) {
      log.info('[ImageGrid] Drag left:', event.dataTransfer?.dropEffect);
    }

    function generateImageData(uids: string[]): ImageData[] {
      return uids.map(uid => {
        const im = store.state.images[uid];
        const mdata = store.state.metadata[uid];

        let selectionType: SelectionType = SelectionType.NONE;
        if (uid === store.state.selection.primary) {
          selectionType = SelectionType.PRIMARY;
        } else if (store.state.selection.additional[uid]) {
          selectionType = SelectionType.ADDITIONAL;
        }

        return {
          uid,
          filePath: im.path,
          previewSize: im.preview_timestamp ? im.preview_size : undefined,
          previewUrl: 'http://localhost:' + PORT + '/images/' + uid,
          label: mdata.label,
          rating: mdata.rating,
          selectionType,
          adjustments: mdata.adjustments,
        };
      });
    }

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
        return;
      }

      if (event.key === '1' && event.ctrlKey) {
        store.rateSelection(1);
        event.preventDefault
        return;
      } else if (event.key === '2' && event.ctrlKey) {
        store.rateSelection(2);
        event.preventDefault
        return;
      } else if (event.key === '3' && event.ctrlKey) {
        store.rateSelection(3);
        event.preventDefault
        return;
      } else if (event.key === '4' && event.ctrlKey) {
        store.rateSelection(4);
        event.preventDefault
        return;
      } else if (event.key === '5' && event.ctrlKey) {
        store.rateSelection(5);
        event.preventDefault
        return;
      } else if (event.key === '0' && event.ctrlKey) {
        store.rateSelection(0);
        event.preventDefault
        return;
      }
      const label = LABELS_MAP[event.key];
      if (label !== undefined) {
        store.labelSelection(label);
        return;
      }

      if (event.keyCode === 39) {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.RIGHT);
        } else {
          store.movePrimarySelection(Direction.RIGHT);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 37) {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.LEFT);
        } else {
          store.movePrimarySelection(Direction.LEFT);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 38) {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.UP);
        } else {
          store.movePrimarySelection(Direction.UP);
        }
        event.preventDefault();
        return;
      } else if (event.keyCode === 40) {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.DOWN);
        } else {
          store.movePrimarySelection(Direction.DOWN);
        }
        event.preventDefault();
        return;
      } else if (event.key === '=' && event.metaKey && event.shiftKey) {
        if (store.state.thumbnailSettings.size < 640) {
          store.setThumbnailSize(store.state.thumbnailSettings.size + 40);
        }
        event.preventDefault();
        return;
      } else if (event.key === '-' && event.metaKey) {
        if (store.state.thumbnailSettings.size > 80) {
          store.setThumbnailSize(store.state.thumbnailSettings.size - 40);
        }
        event.preventDefault();
        return;
      } else if (event.key === ']' && event.metaKey) {
        store.rotateRight();
        event.preventDefault();
        return;
      } else if (event.key === '[' && event.metaKey) {
        store.rotateLeft();
        event.preventDefault();
        return;
      }
    }

    // https://www.html5rocks.com/en/tutorials/dnd/basics/#toc-dnd-files
    // https://thecssninja.com/demo/gmail_dragout/
    function imageBoxDragStarted(uid: string, event: DragEvent) {
      log.info('[ImageGrid] Image box drag started:', uid);
      if (!event.dataTransfer) {
        return;
      }

      if (uid !== store.state.selection.primary) {
        const prevAdditional = { ...store.state.selection.additional };
        const prevPrimary = store.state.selection.primary;
        store.selectPrimary(uid);
        if (prevPrimary && (Object.keys(prevAdditional).length > 0)) {
          for (const puid in prevAdditional) {
            if (uid === puid) {
              continue;
            }
            store.toggleAdditionalSelection(puid);
          }
          store.toggleAdditionalSelection(prevPrimary);
        }
      }

      const uids = new Set<string>([uid]);
      if (store.state.selection.primary) {
        uids.add(store.state.selection.primary);
      }
      for (const additionalUid in store.state.selection.additional) {
        uids.add(additionalUid);
      }
      const files = Array.from(uids).map(u => store.state.images[u]);
      DRAG_HELPER_SERVICE.startDrag(event, files, apiService.thumbnailUrl(uid))
    }

    function imageBoxClicked(uid: string, event: MouseEvent) {
      if (event.metaKey) {
        store.toggleAdditionalSelection(uid);
      } else if (event.shiftKey) {
        store.selectRange(uid);
      } else {
        store.selectPrimary(uid);
      }
    }

    function imageBoxDoubleClicked(uid: string, event: MouseEvent) {
      if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      transientStore.setImageViewerTab(ImageViewerTab.MEDIA);

      event.preventDefault();
      event.stopPropagation();
    }

    watchEffect(() => {
      const lt = store.state.selection.lastTouched;
      if (lt === undefined) {
        return;
      }

      // Due to reuse of elements, we have to be careful not to scroll to an element
      // that was previously shown for the saem key.
      const container = (scroller.value! as any).$el as HTMLDivElement;
      const res = container.querySelector(`[name=box-${lt}]`);
      if (res) {
        (res as any).scrollIntoViewIfNeeded();
      } else {
        // TODO: calculate the position and scroll accordingly.
      }
    })

    return {
      el,
      scroller,
      dragIndicator,

      dragIndicatorVisible,
      dragIndicatorIndex,
      maxSize,
      shortImageBoxVersion,

      dragIndicatorStyle,
      uidGroups,
      imageBoxStyle,
      rowStyle,

      handleResize,
      containerDraggedOver,
      containerDropped,
      containerDragEnded,
      containerDragEntered,
      containerDragLeft,
      imageBoxClicked,
      imageBoxDoubleClicked,
      imageBoxDragStarted,
      keyPressed,
    };
  }
});
</script>
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
import { STORE, Label, Direction } from '@/store';
import { API_SERVICE } from '@/api';
import { ImageData, SelectionType } from './ImageBox.vue';
import ImageBox from './ImageBox.vue';
import { TRANSIENT_STORE, ImageViewerTab } from '../transient-store';

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
    const el = ref<HTMLElement>(null);
    const scroller = ref<HTMLElement>(null);
    const dragIndicator = ref<HTMLDivElement>(null);

    const dragIndicatorVisible = ref(false);
    const dragIndicatorIndex = ref(0);
    const maxSize = computed(() => STORE.state.thumbnailSettings.size);

    const draggedPaths = new Map<string, string>();

    function handleResize() {
      TRANSIENT_STORE.setColumnCount(Math.floor(el.value!.clientWidth / maxSize.value));
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
      const cl = STORE.currentList();

      const result: Row[] = [];
      let cur = [];
      for (const uid of cl.items) {
        cur.push(uid);
        if (cur.length === TRANSIENT_STORE.state.columnCount) {
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
      return STORE.state.thumbnailSettings.size <= 120;
    });

    function containerDropped(event: DragEvent) {
      try {
        dragIndicatorVisible.value = false;
        console.log(['drop', event, Array.from(event?.dataTransfer?.items ?? [])]);

        if (event.dataTransfer?.getData('nmUids')) {
          const nmUids = JSON.parse(event.dataTransfer.getData('nmUids'));
          console.log('moving', nmUids, dragIndicatorIndex.value);
          STORE.moveWithinCurrentList(nmUids, dragIndicatorIndex.value);
          return;
        }

        if (!event?.dataTransfer?.files) {
          return;
        }

        let fullMatch: boolean = true;
        console.log('Num dragged files: ', event.dataTransfer.files.length);
        for (let i = 0; i < event.dataTransfer.files.length; ++i) {
          const p = event.dataTransfer.files.item(i)!.path;
          if (!draggedPaths.has(p)) {
            fullMatch = false;
            break;
          }
        }

        // This is needed for cases when an object is briefly dragged outside of the
        // window. Then the 'nmUid' property is going to be cleared, so we have to
        // rely on files list to see if we should simply move pictures withing the list.
        if (fullMatch) {
          console.log('moving2', draggedPaths.values(), dragIndicatorIndex.value);
          STORE.moveWithinCurrentList([...draggedPaths.values()], dragIndicatorIndex.value);
        } else {
          for (let i = 0; i < event.dataTransfer.files.length; ++i) {
            API_SERVICE.scanPath(event.dataTransfer.files.item(i)!.path);
          }
        }
      } finally {
        draggedPaths.clear();
      }
    }

    function containerDraggedOver(event: DragEvent) {
      const el = (scroller.value! as any).$el as HTMLElement;
      const rect = el.getBoundingClientRect();
      const relX = el.scrollLeft + event.pageX - rect.x;
      const relY = el.scrollTop + event.pageY - rect.y;

      const offX = Number(Math.min(Math.floor(relX / maxSize.value), TRANSIENT_STORE.state.columnCount + 1));
      const offY = Number(Math.floor(relY / maxSize.value));
      // console.log(['over', relX, relY, offX, offY]);
      dragIndicatorIndex.value = offY * TRANSIENT_STORE.state.columnCount + offX;

      const destX = offX * maxSize.value;
      const destY = offY * maxSize.value;

      dragIndicatorVisible.value = true;
      dragIndicator.value!.style.left = `${destX}px`;
      dragIndicator.value!.style.top = `${destY}px`;
      (dragIndicator.value as any).scrollIntoViewIfNeeded();
      // console.log(['drag over', relX, relY, indicatorRef]);
    }

    function containerDragEnded() {
      console.log(['drag end']);
      dragIndicatorVisible.value = false;
    }

    function containerDragEntered(event: DragEvent) {
      console.log(['drag entered', Array.from(event.dataTransfer?.getData('nmUids') ?? [])]);
    }

    function containerDragLeft(event: DragEvent) {
      console.log(['drag left', Array.from(event.dataTransfer?.getData('nmUids') ?? [])]);
    }

    function generateImageData(uids: string[]): ImageData[] {
      return uids.map(uid => {
        const im = STORE.state.images[uid];
        const mdata = STORE.state.metadata[uid];

        let selectionType: SelectionType = SelectionType.NONE;
        if (uid === STORE.state.selection.primary) {
          selectionType = SelectionType.PRIMARY;
        } else if (STORE.state.selection.additional[uid]) {
          selectionType = SelectionType.ADDITIONAL;
        }

        return {
          uid,
          filePath: im.path,
          previewSize: im.preview_timestamp ? im.preview_size : undefined,
          label: mdata.label,
          rating: mdata.rating,
          selectionType,
          adjustments: mdata.adjustments,
        };
      });
    }

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
        console.log('nothing to process');
        return;
      }

      if (event.key === '1' && event.metaKey) {
        STORE.rateSelection(1);
        event.preventDefault
        return;
      } else if (event.key === '2' && event.metaKey) {
        STORE.rateSelection(2);
        event.preventDefault
        return;
      } else if (event.key === '3' && event.metaKey) {
        STORE.rateSelection(3);
        event.preventDefault
        return;
      } else if (event.key === '4' && event.metaKey) {
        STORE.rateSelection(4);
        event.preventDefault
        return;
      } else if (event.key === '5' && event.metaKey) {
        STORE.rateSelection(5);
        event.preventDefault
        return;
      } else if (event.key === '0' && event.metaKey) {
        STORE.rateSelection(0);
        event.preventDefault
        return;
      }
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
      } else if (event.key === '=' && event.metaKey && event.shiftKey) {
        if (STORE.state.thumbnailSettings.size < 640) {
          STORE.setThumbnailSize(STORE.state.thumbnailSettings.size + 40);
        }
        event.preventDefault();
        return;
      } else if (event.key === '-' && event.metaKey) {
        if (STORE.state.thumbnailSettings.size > 80) {
          STORE.setThumbnailSize(STORE.state.thumbnailSettings.size - 40);
        }
        event.preventDefault();
        return;
      } else if (event.key === ']' && event.metaKey) {
        console.log('rotating right');
        STORE.rotateRight();
        event.preventDefault();
        return;
      } else if (event.key === '[' && event.metaKey) {
        console.log('rotating left');
        STORE.rotateLeft();
        event.preventDefault();
        return;
      }
    }

    // https://www.html5rocks.com/en/tutorials/dnd/basics/#toc-dnd-files
    // https://thecssninja.com/demo/gmail_dragout/
    function imageBoxDragStarted(uid: string, event: DragEvent) {
      console.log('imageBoxDragStarted');
      if (!event.dataTransfer) {
        console.log(['yo']);
        return;
      }

      if (uid !== STORE.state.selection.primary) {
        const prevAdditional = { ...STORE.state.selection.additional };
        const prevPrimary = STORE.state.selection.primary;
        STORE.selectPrimary(uid);
        if (prevPrimary && (Object.keys(prevAdditional).length > 0)) {
          for (const puid in prevAdditional) {
            if (uid === puid) {
              continue;
            }
            STORE.toggleAdditionalSelection(puid);
          }
          STORE.toggleAdditionalSelection(prevPrimary);
        }
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

      draggedPaths.clear();
      for (const uid of uids) {
        draggedPaths.set(STORE.state.images[uid].path, uid);
      }
      // TODO: enable later to display number of images being dragged.
      // const dragIcon = document.createElement('div');
      // document.body.appendChild(dragIcon);
      // dragIcon.style.width = '100px';
      // dragIcon.style.height = '100px';
      // dragIcon.textContent = 'blah';
      // dragIcon.style.backgroundColor = 'red';
      // event.dataTransfer.setDragImage(dragIcon, -10, -10);
      // setTimeout(() => document.body.removeChild(dragIcon), 0);

      (window as any).electron.dragStart(paths, API_SERVICE.thumbnailUrl(uid), () => {
        if (!event.dataTransfer) {
          return;
        }
        console.log(['drag start', uid, STORE.state.images[uid].path]);

        event.dataTransfer.effectAllowed = 'move';
      });

      // event.dataTransfer.setData("uid", uid);
      // event.dataTransfer.setData("DownloadURL", API_SERVICE.thumbnailUrl(uid));
    }

    function imageBoxClicked(uid: string, event: MouseEvent) {
      if (event.metaKey) {
        STORE.toggleAdditionalSelection(uid);
      } else if (event.shiftKey) {
        STORE.selectRange(uid);
      } else {
        console.log(['CLICK PRIMARY', uid]);
        STORE.selectPrimary(uid);
      }
    }

    function imageBoxDoubleClicked(uid: string, event: MouseEvent) {
      console.log(['imageBoxDoubleClicked', uid]);
      if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      TRANSIENT_STORE.setImageViewerTab(ImageViewerTab.MEDIA);

      event.preventDefault();
      event.stopPropagation();
    }

    watchEffect(() => {
      const lt = STORE.state.selection.lastTouched;
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
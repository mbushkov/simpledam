<template>
  <div
    class="host"
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

      <template v-slot="{ item }">
        <div class="row" style="rowStyle">
          <ImageBox
            v-for="imageData in generateImageData(item.uids)"
            :key="imageData.uid"
            class="image-box"
            :name="'box-' + imageData.uid"
            :style="imageBoxStyle"
            draggable="true"
            :imageData="imageData"
            @nm-click="imageBoxClicked"
            @nm-dragstart="imageBoxDragStarted"
          ></ImageBox>
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.host {
  // Check why !important is needed.
  background-color: $nm-background-color-lighter !important;
  overflow: scroll;
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

// Otherwise it will try to import it from Webpack or whatever you use.
// https://github.com/electron/electron/issues/7300
const { ipcRenderer } = window.require("electron");


interface Row {
  key: string;
  uids: string[];
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
    const maxSize = ref(300);

    const draggedPaths = new Map<string, string>();
    const draggedUids: string[] = [];

    function handleResize() {
      STORE.updateColumnCount(Math.floor(el.value!.clientWidth / maxSize.value));
    }

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

    const dragIndicatorStyle = computed(() => {
      return {
        'display': dragIndicatorVisible.value ? 'block' : 'none',
        'height': `${maxSize.value}px`,
      };
    });


    function containerDropped(event: DragEvent) {
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
        console.log('moving2', draggedUids, dragIndicatorIndex.value);
        STORE.moveWithinCurrentList(draggedUids, dragIndicatorIndex.value);
      } else {
        for (let i = 0; i < event.dataTransfer.files.length; ++i) {
          API_SERVICE.scanPath(event.dataTransfer.files.item(i)!.path);
        }
      }
    }

    function containerDraggedOver(event: DragEvent) {
      const el = (scroller.value! as any).$el as HTMLElement;
      const rect = el.getBoundingClientRect();
      const relX = el.scrollLeft + event.pageX - rect.x;
      const relY = el.scrollTop + event.pageY - rect.y;

      const offX = Number(Math.min(Math.floor(relX / maxSize.value), STORE.state.columnCount + 1));
      const offY = Number(Math.floor(relY / maxSize.value));
      // console.log(['over', relX, relY, offX, offY]);
      dragIndicatorIndex.value = offY * STORE.state.columnCount + offX;

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
          hasPreview: !!im.preview_timestamp,
          label: mdata.label,
          selectionType
        };
      });
    }

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
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

      ipcRenderer.once('ondragstart-confirmed', () => {
        if (!event.dataTransfer) {
          return;
        }
        console.log(['drag start', uid, STORE.state.images[uid].path]);

        event.dataTransfer.effectAllowed = 'move';
      });
      console.log(['paths', paths]);


      ipcRenderer.send('ondragstart', paths, API_SERVICE.thumbnailUrl(uid));

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

    watchEffect(() => {
      const lt = STORE.state.selection.lastTouched;
      if (lt === undefined) {
        return;
      }

      const container = (scroller.value! as any).$el as HTMLDivElement;
      const res: HTMLElement | null = container.querySelector(`[name=box-${lt}]`);
      if (res) {
        (res as any).scrollIntoViewIfNeeded();
      }
    })

    return {
      el,
      scroller,
      dragIndicator,

      dragIndicatorVisible,
      dragIndicatorIndex,
      maxSize,

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
      generateImageData,
      imageBoxClicked,
      imageBoxDragStarted,
      keyPressed,
    };
  }
});
</script>
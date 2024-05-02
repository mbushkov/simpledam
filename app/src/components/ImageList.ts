import { apiServiceSingleton } from '@/backend/api';
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { Direction, ImageViewerTab, storeSingleton, transientStoreSingleton } from '@/store';
import { Label, type ImageAdjustments, type InferredImageMetadata, type ListColumn } from '@/store/schema';
import * as log from 'loglevel';
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import { dragHelperServiceSingleton } from '../lib/drag-helper-service';
import ImageListRow from './ImageListRow.vue';


// TODO: this component is very similar to ImageGrid. It should be refactored.
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

interface ValueColumn extends ListColumn {
  value: string|number;
}

export const COLUMN_TITLES: {
  [Property in keyof InferredImageMetadata | "preview"]: string;
} = {
  preview: '',
  rating: 'Rating',
  label: 'Label',
  width: 'Width',
  height: 'Height',
  dpi: 'DPI',
  fileName: 'File Name',
  filePath: 'File Path',
  fileSize: 'File Size',
  fileCtime: 'File Creation Time',
  fileMtime: 'File Modification Time',
  fileColorTag: 'File Color Tag',
  iccProfileDescription: 'ICC Profile Description',
  mimeType: 'MIME Type',
  author: 'Author',
  originTime: 'Origin Time',
  captureDevice: 'Capture Device',
  country: 'Country',
  city: 'City',
}

interface Row {
  key: string;
  previewUrl: string;
  previewAdjustments: ImageAdjustments;
  columns: ValueColumn[];
}

interface Props {
  readonly show: boolean;
}

export default defineComponent({
  components: {
    ImageListRow,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
    }
  },
  setup(props: Props) {
    const store = storeSingleton();
    const transientStore = transientStoreSingleton();
    const apiService = apiServiceSingleton();

    const el = ref<HTMLElement>();
    const scroller = ref<HTMLElement>();
    const dragIndicator = ref<HTMLDivElement>();

    const dragIndicatorVisible = ref(false);
    const dragIndicatorIndex = ref(0);
    const maxSize = computed(() => 30);

    // TODO: virtual scroller doesn't react unless the array is replaced.
    const currentList = computed(() => store.currentList().items.slice());
    const headerColumns = store.state.listSettings.columns;

    const rowStyle = computed(() => ({
      'height': `${maxSize.value}px`,
    }));

    const dragIndicatorStyle = computed(() => {
      return {
        'display': dragIndicatorVisible.value ? 'block' : 'none',
      };
    });


    function containerDropped(event: DragEvent) {
      dragIndicatorVisible.value = false;

      const result = dragHelperServiceSingleton().finishDrag(event);
      if (!result) {
        return;
      }

      if (result.contents.kind === 'internal') {
        store.moveWithinCurrentList(result.contents.uids, dragIndicatorIndex.value);
      } else {
        apiService.scanPaths(result.contents.paths);
      }
      event.preventDefault();
    }

    function containerDraggedOver(event: DragEvent) {
      const el = (scroller.value! as any).$el as HTMLElement;
      const rect = el.getBoundingClientRect();
      const relY = el.scrollTop + event.pageY - rect.y;

      dragIndicatorIndex.value = Number(Math.floor(relY / maxSize.value));
      const destY = dragIndicatorIndex.value * maxSize.value;

      dragIndicatorVisible.value = true;
      dragIndicator.value!.style.top = `${destY}px`;
      dragIndicator.value!.style.left = "0";
      dragIndicator.value!.style.width = `${rect.width}px`;
      (dragIndicator.value as any).scrollIntoViewIfNeeded();
    }

    function containerDragEnded() {
      dragIndicatorVisible.value = false;
    }

    function containerDragEntered(event: DragEvent) {
      log.info('[ImageList] Drag entered:', event.dataTransfer?.dropEffect);
    }

    function containerDragLeft(event: DragEvent) {
      log.info('[ImageList] Drag left:', event.dataTransfer?.dropEffect);
    }

    // TODO: this method is exactly the same as in ImageGrid. It should be refactored.
    // https://www.html5rocks.com/en/tutorials/dnd/basics/#toc-dnd-files
    // https://thecssninja.com/demo/gmail_dragout/
    function rowDragStarted(uid: string, event: DragEvent) {
      log.info('[ImageList] Image box drag started:', uid);
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
      dragHelperServiceSingleton().startDrag(event, files, apiService.thumbnailUrl(uid))
    }

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
        return;
      }

      log.debug('[ImageList] Key pressed:', event.code);

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

      if (event.code === 'ArrowRight') {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.RIGHT);
        } else {
          store.movePrimarySelection(Direction.RIGHT);
        }
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowLeft') {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.LEFT);
        } else {
          store.movePrimarySelection(Direction.LEFT);
        }
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowUp') {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.LEFT);
        } else {
          store.movePrimarySelection(Direction.LEFT);
        }
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowDown') {
        if (event.shiftKey) {
          store.moveAdditionalSelection(Direction.RIGHT);
        } else {
          store.movePrimarySelection(Direction.RIGHT);
        }
        event.preventDefault();
        return;
      } else if (event.code === 'BracketRight' && event.metaKey) {
        store.rotateRight();
        event.preventDefault();
        return;
      } else if (event.code === 'BracketLeft' && event.metaKey) {
        store.rotateLeft();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyA' && event.metaKey) {
        store.selectAll();
        event.preventDefault();
      } else if (event.code === 'KeyD' && event.metaKey) {
        store.selectPrimary(undefined);
      }
    }    

    onMounted(() => {
      window.addEventListener('keydown', keyPressed);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', keyPressed)
    });

    watchEffect(() => {
      const lt = store.state.selection.lastTouched;
      if (lt === undefined) {
        return;
      }

      // Due to reuse of elements, we have to be careful not to scroll to an element
      // that was previously shown for the same key.
      const container = (scroller.value as any)?.$el as HTMLDivElement;
      if (!container) {
        return;
      }

      const res = container.querySelector(`[name=row-box-${lt}]`);
      if (res) {
        (res as any).scrollIntoViewIfNeeded();
      } else {
        // TODO: calculate the position and scroll accordingly.
      }
    })

    // TODO: this method is exactly the same as in ImageGrid. It should be refactored.
    function rowClicked(uid:string, event: MouseEvent) {
      if (event.metaKey) {
        store.toggleAdditionalSelection(uid);
      } else if (event.shiftKey) {
        store.selectRange(uid);
      } else {
        store.selectPrimary(uid);
      }
    }

    // TODO: this method is exactly the same as in ImageGrid. It should be refactored.
    async function rowContextClicked(uid:string, event: MouseEvent) {
      store.selectPrimaryPreservingAdditionalIfPossible(uid);

      const filePath = store.state.images[uid].path;
      const openWithEntries = await apiService.fetchOpenWith(filePath);
      electronHelperServiceSingleton().showImageMenu(openWithEntries);      
    }

    // TODO: this method is exactly the same as in ImageGrid. It should be refactored.
    function rowDoubleClicked(uid:string, event: MouseEvent) {
      if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      transientStore.setImageViewerTab(ImageViewerTab.MEDIA);

      event.preventDefault();
      event.stopPropagation();      
    }

    function separatorMouseDown(column: ListColumn, event: MouseEvent) {
      log.info('[ImageList] Separator mouse down for column: ', column.name);
      const originalX = event.screenX
      const originalColumnWidth = column.width;
      const separatorMouseMove = (event: MouseEvent) => {
        const deltaX = event.screenX - originalX;
        column.width = Math.max(30, originalColumnWidth + deltaX);
      };

      window.addEventListener('mousemove', separatorMouseMove);
      window.addEventListener('mouseup', () => {
        window.removeEventListener('mousemove', separatorMouseMove);
      });
    }

    function headerCellContextClicked(column: ListColumn, event: MouseEvent) {
      const usedColumns: {[key: string]: boolean} = {};
      for (const c of headerColumns) {
        usedColumns[c.name] = true;
      }
      const availableColumns = [];
      for (const c in COLUMN_TITLES) {
        if (!usedColumns[c]) {
          availableColumns.push((COLUMN_TITLES as any)[c]);
        }
      }
      electronHelperServiceSingleton().showListColumnMenu(headerColumns.indexOf(column), availableColumns);
    }

    return {
      el,
      scroller,
      dragIndicator,

      dragIndicatorVisible,
      dragIndicatorIndex,
      maxSize,

      dragIndicatorStyle,
      currentList,
      rowStyle,
      headerColumns,
      COLUMN_TITLES,

      rowClicked,
      rowDoubleClicked,
      rowContextClicked,
      rowDragStarted,

      containerDraggedOver,
      containerDropped,
      containerDragEnded,
      containerDragEntered,
      containerDragLeft,

      separatorMouseDown,
      headerCellContextClicked,
    };
  }
});
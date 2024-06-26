import { apiServiceSingleton } from '@/backend/api';
import { electronHelperServiceSingleton } from '@/lib/electron-helper-service';
import { Direction, ImageViewerTab, storeSingleton, transientStoreSingleton } from '@/store';
import { Label, Rotation } from '@/store/schema';
import * as log from 'loglevel';
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// TODO: implement in a generic way with a global shortcuts handler.
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
  setup() {
    const store = storeSingleton();
    const transientStore = transientStoreSingleton();

    const imageUrl = computed(() => {
      if (store.state.selection.primary) {
        return apiServiceSingleton().thumbnailUrl(store.state.selection.primary);
      }

      return undefined;
    });

    const curRotation = computed((): Rotation => {
      if (store.state.selection.primary) {
        return store.state.metadata[store.state.selection.primary].adjustments.rotation;
      } else {
        return Rotation.NONE;
      }
    });

    const isRotated90 = computed(() => curRotation.value === Rotation.DEG_90);
    const isRotated180 = computed(() => curRotation.value === Rotation.DEG_180);
    const isRotated270 = computed(() => curRotation.value === Rotation.DEG_270);

    const img = ref<HTMLImageElement>();

    const scale = ref(transientStoreSingleton().state.singleImageViewerOptions.scale);

    const autoFit = ref(transientStoreSingleton().state.singleImageViewerOptions.autoFit);

    const imageStyle = computed(() => {
      return {};
    });

    const el = ref<HTMLDivElement>();

    watch([autoFit, imageUrl, curRotation], (newValues) => {
      // TODO: store scale and autofit directly in transient store and use it from there. This will also allow to add corresponding toolbar buttons.
      transientStoreSingleton().setSingleImageViewerOptions({
        scale: scale.value,
        autoFit: autoFit.value,
      });

      if (!newValues[0]) {
        return;
      }

      if (!store.state.selection.primary) {
        return;
      }

      const im = store.state.images[store.state.selection.primary];
      if (!im || im.previews.length === 0) {
        return;
      }

      const previewSize = im.previews[0].preview_size;

      nextTick(() => {
        let clientWidth = el.value?.getBoundingClientRect().width ?? 1;
        let clientHeight = el.value?.getBoundingClientRect().height ?? 1;
        if (isRotated90.value || isRotated270.value) {
          const temp = clientWidth;
          clientWidth = clientHeight;
          clientHeight = temp;
        }

        scale.value = Math.min(clientWidth / previewSize.width * 100,
          clientHeight / previewSize.height * 100);
      });
    }, {
      immediate: true,
    });

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
        return;
      }

      log.debug('[SingleImage] Key pressed:', event.code);

      if (event.code === 'Equal' && event.metaKey && event.shiftKey) {
        if (scale.value < 1600) {
          if (scale.value > 95) {
            scale.value = scale.value + 25;
          } else if (scale.value > 40) {
            scale.value = scale.value + 10;
          } else {
            scale.value = scale.value + 5;
          }
        }
        autoFit.value = false;

        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.code === 'Minus' && event.metaKey) {
        if (scale.value > 10) {
          if (scale.value > 125) {
            scale.value = scale.value - 25;
          } else if (scale.value > 60) {
            scale.value = scale.value - 10;
          } else {
            scale.value = scale.value - 5;
          }
        }
        autoFit.value = false;

        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.code === 'Digit0' && event.metaKey) {
        if (autoFit.value) {
          autoFit.value = false;
          scale.value = 100;
        } else {
          autoFit.value = true;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.code === 'ArrowRight') {
        store.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowLeft') {
        store.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowUp') {
        store.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.code === 'ArrowDown') {
        store.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.code === 'BracketRight' && event.metaKey) {
        log.info('[SingleImage] Rotating right.')
        store.rotateRight();
        event.preventDefault();
        return;
      } else if (event.code === 'BracketLeft' && event.metaKey) {
        log.info('[SingleImage] Rotating left.')
        store.rotateLeft();
        event.preventDefault();
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

      if (!event.metaKey && !event.ctrlKey) {
        const label = LABELS_MAP[event.key];
        if (label !== undefined) {
          store.labelSelection(label);
          return;
        }
      }
    }

    function handleResize() {
      let clientWidth = img.value?.clientWidth ?? 0;
      let clientHeight = img.value?.clientHeight ?? 0;
      if (isRotated90.value || isRotated270.value) {
        const temp = clientWidth;
        clientWidth = clientHeight;
        clientHeight = temp;
      }

      if (clientWidth > 0 && clientHeight > 0) {
        const offsetX = Math.max(0, (el.value!.clientWidth - clientWidth) / 2);
        const offsetY = Math.max(0, (el.value!.clientHeight - clientHeight) / 2);

        img.value!.style.left = `${offsetX}px`;
        img.value!.style.top = `${offsetY}px`;
      }
    }

    watch([scale, imageUrl, curRotation], ([_newValue, _oldValue]) => {
      // TODO: check why explicit conversion is needed here.
      const newValue = Number(_newValue);
      const oldValue = Number(_oldValue);

      const im = store.state.images[store.state.selection.primary ?? ''];
      if (!im || im.previews.length === 0) {
        return;
      }
      const previewSize = im.previews[0].preview_size;

      if ((img.value?.width ?? 0) > 0 && (img.value?.height ?? 0) > 0) {
        const scrollOffsetX = el.value!.scrollLeft ?? 0;//+ el.value!.clientWidth / 2;
        const scrollOffsetY = el.value!.scrollTop ?? 0;//+ el.value!.clientHeight / 2;

        const oldWidth = previewSize.width * (oldValue / 100);
        const oldHeight = previewSize.height * (oldValue / 100);
        const newWidth = previewSize.width * (newValue / 100);
        const newHeight = previewSize.height * (newValue / 100);
        img.value!.style.width = `${newWidth}px`;
        img.value!.style.height = `${newHeight}px`;

        handleResize();

        el.value!.scrollTo(
          scrollOffsetX + (newWidth - oldWidth) * 0.5,// + el.value!.clientWidth / 2,
          scrollOffsetY + (newHeight - oldHeight) * 0.5,// + el.value!.clientHeight / 2,
        );
      }
    });

    watch(curRotation, handleResize);

    function doubleClicked() {
      log.info('[SingleImage] Double-clicked, switching tabs.');
      transientStore.setImageViewerTab(ImageViewerTab.THUMBNAILS);
    }

    function contextClicked() {
      log.info('[SingleImage] Context-clicked, showing context menu.');
      electronHelperServiceSingleton().showImageMenu();
    }

    const resizeObserver = new ResizeObserver(handleResize);
    onMounted(() => {
      window.addEventListener('keydown', keyPressed);
      window.addEventListener('resize', handleResize);
      handleResize();
      resizeObserver.observe(el.value!);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', keyPressed);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    });

    return {
      imageUrl,
      imageStyle,
      el,
      img,
      curRotation,
      isRotated90,
      isRotated180,
      isRotated270,

      doubleClicked,
      contextClicked,
    };
  }
});  
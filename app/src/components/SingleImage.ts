import { defineComponent, computed, ref, onMounted, onBeforeUnmount, watch } from '@vue/composition-api';
import { storeSingleton, transientStoreSingleton, Direction, ImageViewerTab } from '@/store';
import { apiServiceSingleton } from '@/backend/api';
import { Rotation } from '@/store/schema';
import * as log from 'loglevel';

export default defineComponent({
  setup(props, context) {
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

    const scale = ref(100);

    const autoFit = ref(true);

    const imageStyle = computed(() => {
      return {};
    });

    const el = ref<HTMLDivElement>();

    watch([autoFit, imageUrl, curRotation], ([newVal]) => {
      if (!newVal) {
        return;
      }

      if (!store.state.selection.primary) {
        return;
      }

      const im = store.state.images[store.state.selection.primary];
      if (!im || !im.preview_size) {
        return;
      }

      context.root.$nextTick(() => {
        let clientWidth = el.value?.getBoundingClientRect().width ?? 1;
        let clientHeight = el.value?.getBoundingClientRect().height ?? 1;
        if (isRotated90.value || isRotated270.value) {
          let temp = clientWidth;
          clientWidth = clientHeight;
          clientHeight = temp;
        }

        scale.value = Math.min(clientWidth / im.preview_size.width * 100,
          clientHeight / im.preview_size.height * 100);
      });
    });

    function keyPressed(event: KeyboardEvent) {
      if (el.value?.style.display === 'none') {
        return;
      }
      // TODO: this depends on the layout use a proper library.
      if (event.key === '=' && event.metaKey && event.shiftKey) {
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
      } else if (event.key === '-' && event.metaKey) {
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
      } else if (event.key === '0' && event.metaKey) {
        if (autoFit.value) {
          autoFit.value = false;
          scale.value = 100;
        } else {
          autoFit.value = true;
        }

        event.preventDefault();
        event.stopImmediatePropagation();
      } else if (event.keyCode === 39) {
        store.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 37) {
        store.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 38) {
        store.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 40) {
        store.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.key === ']' && event.metaKey) {
        log.info('[SingleImage] Rotating right.')
        store.rotateRight();
        event.preventDefault();
        return;
      } else if (event.key === '[' && event.metaKey) {
        log.info('[SingleImage] Rotating left.')
        store.rotateLeft();
        event.preventDefault();
        return;
      }
    }

    function handleResize() {
      let clientWidth = img.value?.clientWidth ?? 0;
      let clientHeight = img.value?.clientHeight ?? 0;
      if (isRotated90.value || isRotated270.value) {
        let temp = clientWidth;
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
      if (!im || !im.preview_size) {
        return;
      }

      if ((img.value?.width ?? 0) > 0 && (img.value?.height ?? 0) > 0) {
        const scrollOffsetX = el.value!.scrollLeft ?? 0;//+ el.value!.clientWidth / 2;
        const scrollOffsetY = el.value!.scrollTop ?? 0;//+ el.value!.clientHeight / 2;

        const oldWidth = im.preview_size.width * (oldValue / 100);
        const oldHeight = im.preview_size.height * (oldValue / 100);
        const newWidth = im.preview_size.width * (newValue / 100);
        const newHeight = im.preview_size.height * (newValue / 100);
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
      log.info('[SingleImage] Double-clicked, switching tabs.')
      transientStore.setImageViewerTab(ImageViewerTab.THUMBNAILS);
    }

    onMounted(() => {
      window.addEventListener('keydown', keyPressed);
      window.addEventListener('resize', handleResize)
      handleResize();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('keydown', keyPressed);
      window.removeEventListener('resize', handleResize)
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
    };
  }
});  
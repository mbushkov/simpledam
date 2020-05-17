<template>
  <div class="single-image" ref="el" @dblclick.stop.prevent="doubleClicked($event)">
    <img ref="img" :src="imageUrl" :style="imageStyle" class="image" v-if="imageUrl" />
  </div>
</template>
<style lang="scss" scoped>
@import '../styles/variables';

.single-image {
  overflow: scroll;
  width: 100%;
  height: 100%;
  background-color: $nm-background-color-lighter;

  .image {
    display: block;
    max-width: none;
    max-height: none;
  }

  border: 1px solid black;
}
</style>
<script lang="ts">
import { defineComponent, computed, ref, onMounted, onBeforeUnmount, watch } from '@vue/composition-api';
import { STORE, Direction } from '../store';
import { API_SERVICE } from '../api';
import { TRANSIENT_STORE, ImageViewerTab } from '../transient-store';


export default defineComponent({
  setup(props, context) {
    const imageUrl = computed(() => {
      if (STORE.state.selection.primary) {
        return API_SERVICE.thumbnailUrl(STORE.state.selection.primary);
      }

      return undefined;
    });

    const img = ref<HTMLImageElement>(null);

    const scale = ref(100);

    const autoFit = ref(true);

    const imageStyle = computed(() => {
      return {};
    });

    const el = ref<HTMLDivElement>(null);

    watch(autoFit, (newVal: boolean) => {
      console.log(['AUTO FIT', newVal]);
      if (!newVal) {
        return;
      }

      if (!STORE.state.selection.primary) {
        return;
      }

      const im = STORE.state.images[STORE.state.selection.primary];
      if (!im || !im.preview_size) {
        return;
      }


      context.root.$nextTick(() => {
        scale.value = Math.min((el.value?.clientWidth ?? 1) / im.preview_size.width * 100,
          (el.value?.clientHeight ?? 1) / im.preview_size.height * 100);
        console.log(['AUT OFIT SCALE', el.value, im.preview_size, scale.value]);
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
        STORE.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 37) {
        STORE.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 38) {
        STORE.movePrimarySelection(Direction.LEFT);
        event.preventDefault();
        return;
      } else if (event.keyCode === 40) {
        STORE.movePrimarySelection(Direction.RIGHT);
        event.preventDefault();
        return;
      }
      console.log(['key', event]);
    }

    function handleResize() {
      if ((img.value?.clientWidth ?? 0) > 0 && (img.value?.clientHeight ?? 0) > 0) {
        const offsetX = Math.max(0, (el.value!.clientWidth - img.value!.clientWidth) / 2);
        const offsetY = Math.max(0, (el.value!.clientHeight - img.value!.clientHeight) / 2);

        img.value!.style.left = `${offsetX}px`;
        img.value!.style.top = `${offsetY}px`;
      }
    }

    watch(scale, (newValue, oldValue) => {
      const im = STORE.state.images[STORE.state.selection.primary ?? ''];
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


        // console.log(['SCROLL', scale.value, im.preview_size.width * (newValue - oldValue) / 50, im.preview_size.height * (newValue - oldValue) / 50,]);
        el.value!.scrollTo(
          scrollOffsetX + (newWidth - oldWidth) * 0.5,// + el.value!.clientWidth / 2,
          scrollOffsetY + (newHeight - oldHeight) * 0.5,// + el.value!.clientHeight / 2,
        );
        console.log(['SCALE', newValue, oldValue, (scrollOffsetX) * (newValue / oldValue), (newWidth - oldWidth)]);
      }
    });

    function doubleClicked() {
      console.log('double clicked');
      TRANSIENT_STORE.setImageViewerTab(ImageViewerTab.THUMBNAILS);
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

      doubleClicked,
    };
  }
});  
</script>
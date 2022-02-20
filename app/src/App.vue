<template>
  <div>
    <div v-if="!loaded">Loading...</div>

    <div v-if="loaded">
      <ToolBar class="tool-bar"></ToolBar>
      <div class="splitpane-container">
        <splitpane-container
          @ready="splitpanesReady()"
          @resize="splitpanesResizing()"
          @resized="splitpanesResized()"
        >
          <splitpane
            :size="sideBarSize"
            :min-size="minSideBarSize"
            :max-size="maxSideBarSize"
            class="left-pane"
            ref="leftPane"
          >
            <SideBar class="side-bar"></SideBar>
          </splitpane>
          <splitpane class="right-pane">
            <ImageViewer class="image-viewer" ref="imageViewerRef"></ImageViewer>
          </splitpane>
        </splitpane-container>
      </div>
      <StatusBar class="status-bar"></StatusBar>
    </div>
  </div>
</template>

<style lang="scss">
@import "./styles/variables";

// Import virtual scroller's styles.
@import "~vue-virtual-scroller/dist/vue-virtual-scroller.css";

// Import Bulma styles
@import "~bulma";

// Splitpanes styling.
.splitpanes {
  background: $nm-background-color;
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: $splitter-size;
  background-color: $nm-background-color;
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: $splitter-size;
  background-color: $nm-background-color;
}
//

.tabs a {
  padding: 0.2em 0.5em;
}

html {
  background-color: inherit;
  overflow: auto;
}

body {
  user-select: none;
  background-color: $nm-background-color !important;
}

// Do not show modal close button.
button.modal-close {
  display: none;
}

::-webkit-scrollbar {
  background-color: transparent;
}
/* Let's get this party started */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* Track */
::-webkit-scrollbar-track {
  -webkit-border-radius: 10px;
  border-radius: 10px;
}

::-webkit-scrollbar-corner {
  background-color: transparent;
}

/* Handle */
::-webkit-scrollbar-thumb {
  -webkit-border-radius: 10px;
  border-radius: 10px;
  background: rgba(94, 94, 94, 0.95);
}
::-webkit-scrollbar-thumb:window-inactive {
  background: rgba(94, 94, 94, 0.4);
}
</style>

<style lang="scss" scoped>
@import "./styles/variables";

$status-bar-height: 20px;
$tool-bar-height: $status-bar-height * 2;

#app {
  background-color: $nm-background-color;
  margin: 0;
  padding: 0;

  .splitpane-container {
    position: absolute;
    top: $tool-bar-height;
    bottom: $status-bar-height;
    left: 0;
    right: 0;

    .left-pane {
      padding-left: $splitter-size;
      min-width: 250px;

      .side-bar {
        width: 100%;
        height: 100%;
      }
    }

    .right-pane {
      padding-right: $splitter-size;

      .image-viewer {
        width: 100%;
        height: 100%;
      }
    }
  }

  .status-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: $status-bar-height;
  }

  .tool-bar {
    left: 0;
    right: 0;
    top: 0;
    height: $tool-bar-height;
    position: absolute;
  }
}
</style>

<script lang="ts">
import { apiServiceSingleton } from "@/backend/api";
import { storeSingleton, transientStoreSingleton } from "@/store";
import * as log from "loglevel";
import {
  ComponentPublicInstance,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from "vue";
import { backendMirrorSingleton } from "./backend/backend-mirror";
import ImageViewer from "./components/ImageViewer.vue";
import SideBar from "./components/sidebar/SideBar.vue";
import StatusBar from "./components/StatusBar.vue";
import ToolBar from "./components/ToolBar.vue";

export default defineComponent({
  components: {
    SideBar,
    StatusBar,
    ToolBar,
    ImageViewer,
  },
  setup() {
    onMounted(() => {
      apiServiceSingleton()
        .fetchState()
        .then((s) => {
          if (s !== undefined) {
            storeSingleton().replaceState(s);
          }

          loaded.value = true;
        });

      window.addEventListener("resize", handleResize);
    });

    const resizeObserver = new ResizeObserver(handleResize);
    onBeforeUnmount(() => {
      resizeObserver.disconnect();
    });

    watchEffect(() => {
      document.title =
        backendMirrorSingleton().state.catalogPath || "<unnamed>";
    });

    const minSideBarSize = ref(20);
    const maxSideBarSize = ref(50);
    const sideBarSize = ref(20);
    const sideBarSizePx = ref(250);
    const loaded = ref(false);

    const leftPane = ref<ComponentPublicInstance | undefined>();
    const imageViewerRef = ref<InstanceType<typeof ImageViewer>>();

    watch(leftPane, (r, oldR) => {
      if (oldR) {
        resizeObserver.unobserve(oldR.$el);
      }
      if (r) {
        resizeObserver.observe(r.$el);
      }
    });

    function handleResize() {
      if (leftPane.value) {
        transientStoreSingleton().setLeftPaneWidth(
          leftPane.value.$el.clientWidth
        );
      }
    }

    function splitpanesReady() {
      handleResize();
    }

    function splitpanesResizing() {
      handleResize();
      log.debug("[App] Split panes are currently resizing.");
    }

    function splitpanesResized() {
      handleResize();

      if (!leftPane.value || !imageViewerRef.value) {
        return;
      }

      sideBarSizePx.value = leftPane.value.$el.clientWidth;
      log.debug(
        "[App] Split panes done resizing. Sidebar size: ",
        sideBarSizePx.value
      );
    }

    return {
      minSideBarSize,
      maxSideBarSize,
      sideBarSize,
      sideBarSizePx,
      loaded,

      leftPane,
      imageViewerRef,

      splitpanesReady,
      splitpanesResizing,
      splitpanesResized,
    };
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

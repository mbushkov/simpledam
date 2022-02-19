<template>
  <div id="app">
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
  }
}
</style>

<script lang="ts">
import Vue from "vue";
import SideBar from "./components/sidebar/SideBar.vue";
import StatusBar from "./components/StatusBar.vue";
import ToolBar from "./components/ToolBar.vue";
import ImageViewer from "./components/ImageViewer.vue";
import { storeSingleton, transientStoreSingleton } from "@/store";
import { apiServiceSingleton } from "@/backend/api";
import * as log from "loglevel";
import { actionServiceSingleton } from "./actions";
import { watchEffect } from "@vue/composition-api";
import { backendMirrorSingleton } from "./backend/backend-mirror";
import { electronHelperServiceSingleton } from "./lib/electron-helper-service";
import { initialState } from "./store/store";

export default Vue.extend({
  name: "App",
  components: {
    SideBar,
    StatusBar,
    ToolBar,
    ImageViewer,
  },
  data() {
    return {
      minSideBarSize: 20,
      maxSideBarSize: 50,
      sideBarSize: 20,
      sideBarSizePx: 250,
      loaded: false,
    };
  },
  beforeCreate() {
    apiServiceSingleton()
      .fetchState()
      .then((s) => {
        if (s !== undefined) {
          storeSingleton().replaceState(s);
        }

        (this as any)["loaded"] = true;
      });

    watchEffect(() => {
      document.title =
        backendMirrorSingleton().state.catalogPath || "<unnamed>";
    });
  },
  methods: {
    handleResize() {
      const ref = this.$refs.leftPane as Vue | undefined;
      if (ref) {
        transientStoreSingleton().setLeftPaneWidth(ref.$el.clientWidth);
      }
      // this.minSideBarSize = 180 / this.$el.clientWidth * 100;
      // this.maxSideBarSize = 50;
      // this.sideBarSize = Math.max(this.minSideBarSize, Math.min(this.sideBarSizePx / this.$el.clientWidth * 100, this.maxSideBarSize));
    },

    splitpanesReady() {
      // TODO: this is a horrible hack - rewrite vue inifinite scroller to make this unnecessary.
      for (let i = 0; i < 5000; i += 100) {
        setTimeout(() => {
          log.debug("[App] Handling initial split panes resize.");
          (this.$refs["imageViewerRef"] as any).handleResize();
          this.handleResize();
        }, i);
      }
    },

    splitpanesResizing() {
      this.handleResize();

      log.debug("[App] Split panes are currently resizing.");
      Vue.nextTick((this.$refs["imageViewerRef"] as any).handleResize);
    },

    splitpanesResized() {
      this.handleResize();

      this.sideBarSizePx = (this.$refs.leftPane as Vue).$el.clientWidth;
      log.debug(
        "[App] Split panes done resizing. Sidebar size: ",
        this.sideBarSizePx
      );
      Vue.nextTick((this.$refs["imageViewerRef"] as any).handleResize);
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
});

(window as any).addEventListener(
  "nm-action",
  (event: CustomEvent<{ actionName: string; args: any[] }>) => {
    actionServiceSingleton().performAction(
      event.detail.actionName,
      ...event.detail.args
    );
  }
);
(window as any).addEventListener("nm-check-for-unsaved-changes", async () => {
  const currentState = storeSingleton().state;
  const savedState =
    (await apiServiceSingleton().fetchState()) || initialState();
  const currentStateStr = JSON.stringify(currentState);
  const savedStateStr = JSON.stringify(savedState);

  if (currentStateStr !== savedStateStr) {
    electronHelperServiceSingleton().confirmClosingWindow();
  } else {
    electronHelperServiceSingleton().closeWindow();
  }
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

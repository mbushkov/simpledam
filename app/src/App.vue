<template>
  <div id="app">
    <div v-if="!loaded">Loading...</div>

    <div v-if="loaded">
      <ToolBar class="tool-bar"></ToolBar>
      <div class="splitpane-container">
        <splitpane-container @resized="splitpanesResized()">
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
            <ImageViewer class="image-viewer"></ImageViewer>
          </splitpane>
        </splitpane-container>
      </div>
      <StatusBar class="status-bar"></StatusBar>
    </div>
  </div>
</template>

<style lang="scss">
@import './styles/variables';

// Import virtual scroller's styles.
@import '~vue-virtual-scroller/dist/vue-virtual-scroller.css';

// Import Bulma's core
@import '~bulma/sass/utilities/_all';

// Set your colors
$primary: $nm-primary-color;
$primary-invert: $nm-background-color;
$background: #808080;
$text: $nm-text-color;

// Labels
$label-none: #ffffff;
$label-none-invert: findColorInvert($label-none);
$label-red: #f00000;
$label-red-invert: findColorInvert($label-red);
$label-green: #008000;
$label-green-invert: findColorInvert($label-green);
$label-blue: #0000f0;
$label-blue-invert: findColorInvert($label-blue);
$label-brown: #804000;
$label-brown-invert: findColorInvert($label-brown);
$label-magenta: #f000f0;
$label-magenta-invert: findColorInvert($label-magenta);
$label-orange: #f08020;
$label-orange-invert: findColorInvert($label-orange);
$label-yellow: #f0f000;
$label-yellow-invert: findColorInvert($label-yellow);
$label-cyan: #00f0f0;
$label-cyan-invert: findColorInvert($label-cyan);
$label-gray: #808080;
$label-gray-invert: findColorInvert($label-gray);

$label-selected: #ff8a0d;
$label-selected-invert: findColorInvert($label-selected);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  'white': (
    $white,
    $black
  ),
  'black': (
    $black,
    $white
  ),
  'light': (
    $light,
    $light-invert
  ),
  'dark': (
    $dark,
    $dark-invert
  ),
  'primary': (
    $primary,
    $primary-invert
  ),
  'info': (
    $info,
    $info-invert
  ),
  'success': (
    $success,
    $success-invert
  ),
  'warning': (
    $warning,
    $warning-invert
  ),
  'danger': (
    $danger,
    $danger-invert
  ),
  'label-none': (
    $label-none,
    $label-none-invert
  ),
  'label-red': (
    $label-red,
    $label-red-invert
  ),
  'label-green': (
    $label-green,
    $label-green-invert
  ),
  'label-blue': (
    $label-blue,
    $label-blue-invert
  ),
  'label-brown': (
    $label-brown,
    $label-brown-invert
  ),
  'label-magenta': (
    $label-magenta,
    $label-magenta-invert
  ),
  'label-orange': (
    $label-orange,
    $label-orange-invert
  ),
  'label-yellow': (
    $label-yellow,
    $label-yellow-invert
  ),
  'label-cyan': (
    $label-cyan,
    $label-cyan-invert
  ),
  'label-gray': (
    $label-gray,
    $label-gray-invert
  ),
  'label-selected': (
    $label-selected,
    $label-selected-invert
  )
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// Import Bulma and Buefy styles
@import '~bulma';
@import '~buefy/src/scss/buefy';

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
}

body {
  user-select: none;
  background-color: $nm-background-color !important;
}
</style>

<style lang="scss" scoped>
@import './styles/variables';

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
import Vue from 'vue';
import SideBar from './components/sidebar/SideBar.vue';
import StatusBar from './components/StatusBar.vue';
import ToolBar from './components/ToolBar.vue';
import ImageViewer from './components/ImageViewer.vue';
import { BACKEND_MIRROR } from './backend-mirror';
import { STORE } from './store';
import { API_SERVICE } from './api';

// Otherwise it will try to import it from Webpack or whatever you use.
// https://github.com/electron/electron/issues/7300
const { ipcRenderer } = window.require("electron");


export default Vue.extend({
  name: 'App',
  components: {
    SideBar,
    StatusBar,
    ToolBar,
    ImageViewer,
  },
  data() {
    return {
      minSideBarSize: 20,
      maxSideBarSize: 20,
      sideBarSize: 20,
      sideBarSizePx: 250,
      loaded: false,
    };
  },
  beforeCreate() {
    API_SERVICE.fetchState().then(s => {
      if (s !== undefined) {
        STORE.replaceState(s);
      }

      (this as any)['loaded'] = true;
    });
  },
  methods: {
    handleResize() {
      this.minSideBarSize = 180 / this.$el.clientWidth * 100;
      this.maxSideBarSize = 50;
      this.sideBarSize = Math.max(this.minSideBarSize, Math.min(this.sideBarSizePx / this.$el.clientWidth * 100, this.maxSideBarSize));
    },

    splitpanesResized() {
      // console.log('event', this.$refs.leftPane.$el.clientWidth);
      this.sideBarSizePx = (this.$refs.leftPane as Vue).$el.clientWidth;
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
});

ipcRenderer.on('save', async () => {
  if (!BACKEND_MIRROR.state.catalogPath) {
    // TODO: once is not really needed here. A global "on" should be enough.
    ipcRenderer.once('show-save-catalog-dialog-reply', (event: Electron.IpcRendererEvent, path: string) => {
      if (!path.endsWith('.nmcatalog')) {
        path += '.nmcatalog'
      }

      if (path) {
        console.log(['save new', BACKEND_MIRROR.state.catalogPath, path]);
        API_SERVICE.saveStore(path, STORE.state);
      } else {
        console.log('save declined');
      }
    });
    ipcRenderer.send('show-save-catalog-dialog');
  } else {
    console.log(['save existing', BACKEND_MIRROR.state.catalogPath]);
    API_SERVICE.saveStore(BACKEND_MIRROR.state.catalogPath, STORE.state);
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

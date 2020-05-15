<template>
  <div id="app">
    <ToolBar class="tool-bar"></ToolBar>
    <SideBar class="side-bar"></SideBar>
    <ImageGrid class="image-grid"></ImageGrid>
    <StatusBar class="status-bar"></StatusBar>
  </div>
</template>

<style lang="scss">
@import './styles/variables';

// Import Bulma's core
@import '~bulma/sass/utilities/_all';

// Set your colors
$primary: #8c67ef;
$primary-invert: findColorInvert($primary);
$twitter: #4099ff;
$twitter-invert: findColorInvert($twitter);
$text: #d2d2d2;

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
  'twitter': (
    $twitter,
    $twitter-invert
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

body {
  user-select: none;
}
</style>

<style lang="scss" scoped>
@import './styles/variables';

$side-bar-width: 300px;
$status-bar-height: 20px;
$tool-bar-height: $status-bar-height * 2;

#app {
  background-color: $nm-background-color;
  margin: 0;
  padding: 0;

  .side-bar {
    position: absolute;
    left: 0;
    top: $tool-bar-height;
    bottom: $status-bar-height;
    width: $side-bar-width;
  }

  .image-grid {
    position: absolute;
    left: $side-bar-width;
    right: 0;
    top: $tool-bar-height;
    bottom: $status-bar-height;
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
import ImageGrid from './components/ImageGrid.vue';
import SideBar from './components/SideBar.vue';
import StatusBar from './components/StatusBar.vue';
import ToolBar from './components/ToolBar.vue';
import { BACKEND_MIRROR } from './backend-mirror';
import { STORE } from './store';
import { API_SERVICE } from './api';

// Otherwise it will try to import it from Webpack or whatever you use.
// https://github.com/electron/electron/issues/7300
const { ipcRenderer } = window.require("electron");


export default Vue.extend({
  name: 'App',
  components: {
    ImageGrid,
    SideBar,
    StatusBar,
    ToolBar,
  },
  created() {
    API_SERVICE.fetchState().then(s => {
      if (s === undefined) {
        return;
      }

      for (let key in (s as any)) {
        (STORE.state as any)[key] = (s as any)[key];
      }
    });
  },
});

ipcRenderer.on('save', async () => {
  if (!BACKEND_MIRROR.state.catalogPath) {
    ipcRenderer.once('show-save-catalog-dialog-reply', (event: Electron.IpcRendererEvent, path: string) => {
      console.log(['save new', BACKEND_MIRROR.state.catalogPath, path]);
      API_SERVICE.saveStore(path, STORE.state);
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

<template>
  <div id="app">
    <ToolBar class="tool-bar"></ToolBar>
    <SideBar class="side-bar"></SideBar>
    <ImageGrid class="image-grid"></ImageGrid>
    <StatusBar class="status-bar"></StatusBar>
  </div>
</template>

<style lang="scss">
$background-color: #282828;
</style>

<style lang="scss" scoped>
@import "./styles/variables";

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

export default Vue.extend({
  name: 'App',
  components: {
    ImageGrid,
    SideBar,
    StatusBar,
    ToolBar,
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

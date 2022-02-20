<template>
  <div class="collaspe">
    <div class="card">
      <div
        class="card-header collapse-trigger"
        role="button"
        v-on:click="toggle()"
      >
        <p class="card-header-title">{{ title }}</p>
        <a class="card-header-icon">
          <Icon :icon="inputValue ? 'menu-down' : 'menu-up'"></Icon>
        </a>
      </div>
      <div class="card-content collapse-content" v-show="inputValue !== false">
        <div class="content">
          <slot></slot>
        </div>
      </div>    
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

.collapse {
  .collapse-trigger {
    display: inline;
    cursor: pointer;
  }
  .collapse-content {
    display: inherit;
  }
}

.card {
  background-color: $nm-background-color;

  .card-header {
    background-color: $nm-dark-color;

    .card-header-title {
      padding-left: 0.25rem;
      padding-right: 0;
      padding-top: 0;
      padding-bottom: 0;
      margin: 0;
      color: $nm-text-color;
      font-size: 13px;
      font-weight: normal;
    }
  }

  .card-header-icon {
    padding: 0;
    margin: 0;
    color: $nm-text-color;
    font-size: 20px;
  }

  .card-content {
    padding: 0.5rem;
  }
}
</style>

<script lang="ts">
import Collapse from "./Collapse";
export default Collapse;
</script>
<template>
  <div class="pane">
    <b-collapse class="card" animation="slide" aria-id="contentIdForA11y3">
      <div
        slot="trigger"
        slot-scope="props"
        class="card-header"
        role="button"
        aria-controls="contentIdForA11y3"
      >
        <p class="card-header-title">{{ title }}</p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content">
          <slot></slot>
        </div>
      </div>
    </b-collapse>
  </div>
</template>
<style lang="scss" scoped>
@import '../../styles/variables';

.pane {
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
}
</style>
<script lang="ts">
import Pane from './Pane';
export default Pane;
</script>
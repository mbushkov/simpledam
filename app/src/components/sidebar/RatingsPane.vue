<template>
  <Pane title="Rating">
    <div class="ratings">
      <div class="row" v-for="entry in entries" :key="entry.rating">
        <div class="rating-name">
          <span class="rating-title" v-if="entry.rating === 0">None</span>
          <span class="rating-icons" v-if="entry.rating > 0">
            <b-rate :disabled="true" :max="entry.rating" size="is-small"></b-rate>
          </span>
        </div>
        <div class="rating-count">
          <span class="count">{{ counts[entry.rating] }}</span>
          <Radio
            size="is-small"
            type="is-rating-selected"
            native-value="true"
            v-model="entry.selected"
            v-on:click.native.prevent="ratingClicked(entry, $event)"
          ></Radio>
        </div>
      </div>
    </div>
  </Pane>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";

.ratings {
  display: flex;
  flex-direction: column;

  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    height: 24px;

    .rating-name {
      display: flex;
      align-items: center;
      color: $nm-text-color;

      span.rating-title {
        position: relative;
        top: 1px;
        font-size: 13px;
      }

      span.rating-icons {
        font-size: 15px;
        color: $nm-text-color;
      }
    }

    .rating-count {
      display: flex;
      align-items: center;
      color: $nm-text-color;
      font-size: 13px;

      span.count {
        margin-right: 0.5em;
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>

<script lang="ts">
import RatingsPane from "./RatingsPane";
export default RatingsPane;
</script>
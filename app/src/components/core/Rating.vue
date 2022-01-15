<template>
  <div
    class="rate is-disabled">
    <div
        v-for="(itemStyle, index) in rateStyles"
        class="rate-item"
        :class="itemStyle"
        :key="index">
        <Icon
            :pack="iconPack"
            :icon="icon"
            :size="size"
        />
    </div>
  </div>  
</template>

<style lang="scss" scoped>
@import "../../styles/variables";
</style>

<script lang="ts">
import Rating from "./Rating";
export default Rating;
</script>
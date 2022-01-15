<template>
  <label
    class="b-radio radio"
    ref="label"
    :class="[size, { 'is-disabled': disabled }]"
    :disabled="disabled"
    @click="focus"
    @keydown.prevent.enter="$refs.label.click()">
    <input
        v-model="inputValue"
        type="radio"
        ref="input"
        @click.stop
        :disabled="disabled"
        :required="required"
        :name="name"
        :value="nativeValue">
    <span class="check" :class="type" />
    <span class="control-label"><slot/></span>
  </label>
</template>

<style lang="scss" scoped>
@import "../../styles/variables";
</style>

<script lang="ts">
import Radio from "./Radio";
export default Radio;
</script>
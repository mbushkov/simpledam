<template>
  <Icon
    :type="'is-label-' + labelNames[value]"
    icon="checkbox-blank"
    size="is-small">
</Icon>

</template>

<style lang="scss" scoped>
@import "../../styles/variables";

</style>

<script lang="ts">
import LabelIcon from "./LabelIcon";
export default LabelIcon;
</script>
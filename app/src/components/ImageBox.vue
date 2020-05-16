<template>
  <div
    draggable="true"
    class="host"
    :id="'box-' + imageData.uid"
    :class="{ selected: isPrimarySelected, 'additional-selected': isAdditionalSelected }"
    @dragstart="dragStarted($event)"
    @click="clicked($event)"
  >
    <div class="nested">
      <img
        v-if="imageData.hasPreview"
        :src="'http://127.0.0.1:' + port + '/images/' + imageData.uid"
      />
    </div>
    <div class="title">{{ filename(imageData.filePath) }} {{ imageData.label }}</div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.host {
  border: 1px solid #454545;
  position: relative;

  &.selected {
    border: 1px solid white;
  }

  &.additional-selected {
    border: 1px solid yellow;
  }

  .nested {
    position: absolute;
    left: 5px;
    right: 5px;
    top: 5px;
    bottom: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    img {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
  }

  .title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 30px;

    color: $nm-text-color;
    font-size: 13px;
    line-height: 1;
    font-weight: normal;
  }
}
</style>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { PORT } from '@/api';
import { Label } from '@/store';

export interface ImageData {
  readonly uid: string;
  readonly filePath: string;
  readonly hasPreview: boolean;
  readonly label: Label;
}

export enum SelectionType {
  NONE,
  PRIMARY,
  ADDITIONAL,
}

interface Props {
  readonly imageData: ImageData;
  readonly selectionType: SelectionType;
}

export default defineComponent({
  props: {
    imageData: {
      type: Object,
      required: true,
    },
    selectionType: {
      type: Number,
      default: SelectionType.NONE,
    },
  },
  setup(props: Props) {

    const isPrimarySelected = computed(() => props.selectionType === SelectionType.PRIMARY);
    const isAdditionalSelected = computed(() => props.selectionType === SelectionType.ADDITIONAL);

    function clicked(event: MouseEvent) {
      console.log(['clicked', event]);
    }

    function dragStarted(event: DragEvent) {
      console.log(['drag started', event]);
    }


    function filename(value: string) {
      const components = value.split('/');
      return components[components.length - 1];
    }

    return {
      isPrimarySelected,
      isAdditionalSelected,

      port: PORT,

      clicked,
      dragStarted,
      filename,
    };
  }
});
</script>
<template>
  <div
    draggable="true"
    class="image-box"
    :class="{ selected: isPrimarySelected, 'additional-selected': isAdditionalSelected }"
    @dragstart="dragStarted($event)"
    @click="clicked($event)"
  >
    <div class="nested">
      <img
        v-if="imageData.hasPreview"
        :class="{'rotated-90': isRotated90, 'rotated-180': isRotated180, 'rotated-270': isRotated270 }"
        :src="'http://127.0.0.1:' + port + '/images/' + imageData.uid"
      />
    </div>
    <div class="metadata">
      <div class="ib-label">
        <b-icon
          :type="{['is-label-' + labelNames[imageData.label]]: true}"
          icon="checkbox-blank"
          size="is-small"
          class="icon"
        ></b-icon>
      </div>
      <div class="ib-rating">
        <b-rate :disabled="true" :max="5" v-model="imageData.rating" size="is-small"></b-rate>
      </div>
    </div>
    <div class="title">{{ filename(imageData.filePath) }}</div>
  </div>
</template>

<style lang="scss" scoped>
@import '../styles/variables';

.image-box {
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
    bottom: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    img {
      display: block;
      max-width: 100%;
      max-height: 100%;

      &.rotated-90 {
        transform: rotate(90deg);
      }

      &.rotated-180 {
        transform: rotate(180deg);
      }

      &.rotated-270 {
        transform: rotate(270deg);
      }
    }
  }

  .title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 22px;

    color: $nm-text-color;
    font-size: 13px;
    line-height: 1;
    font-weight: normal;

    display: flex;
    align-items: center;
    justify-content: center;

    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .metadata {
    position: absolute;
    bottom: 22px;
    left: 0;
    right: 0;
    height: 20px;

    color: $nm-text-color;
    font-size: 13px;
    line-height: 1;
    font-weight: normal;

    display: flex;
    justify-content: center;
    align-items: flex-end;

    .ib-label {
      font-size: 14px;
      margin-right: 0.25em;
    }

    .ib-rating {
      ::v-deep {
        .rate .rate-item.set-on .icon {
          color: $nm-text-color;
        }
        .rate .icon {
          color: $nm-background-color-lighter-tone-up;
        }
      }
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, computed, SetupContext } from '@vue/composition-api';
import { PORT } from '@/api';
import { Label, ImageAdjustments, Rotation, Rating } from '@/store';

export interface ImageData {
  readonly uid: string;
  readonly filePath: string;
  readonly hasPreview: boolean;
  readonly label: Label;
  readonly rating: Rating;
  readonly selectionType: SelectionType;
  readonly adjustments: ImageAdjustments;
}

export enum SelectionType {
  NONE,
  PRIMARY,
  ADDITIONAL,
}

interface Props {
  readonly imageData: ImageData;
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
  setup(props: Props, context: SetupContext) {

    const labelNames = {
      [Label.NONE]: 'none',
      [Label.RED]: 'red',
      [Label.GREEN]: 'green',
      [Label.BLUE]: 'blue',
      [Label.BROWN]: 'brown',
      [Label.MAGENTA]: 'magenta',
      [Label.ORANGE]: 'orange',
      [Label.YELLOW]: 'yellow',
      [Label.CYAN]: 'cyan',
      [Label.GRAY]: 'gray',
    };

    const isPrimarySelected = computed(() => props.imageData.selectionType === SelectionType.PRIMARY);
    const isAdditionalSelected = computed(() => props.imageData.selectionType === SelectionType.ADDITIONAL);
    const isRotated90 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_90);
    const isRotated180 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_180);
    const isRotated270 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_270);

    let clickCount = 0;
    let clickTimer: ReturnType<typeof setTimeout>;
    function clicked(event: MouseEvent) {
      event.preventDefault();

      ++clickCount;
      if (clickCount === 1) {
        context.emit('nm-click', props.imageData.uid, event);
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 250);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        context.emit('nm-dblclick', props.imageData.uid, event);
      }
    }

    function dragStarted(event: DragEvent) {
      context.emit('nm-dragstart', props.imageData.uid, event);
    }

    function filename(value: string) {
      const components = value.split('/');
      return components[components.length - 1];
    }

    return {
      labelNames,

      isPrimarySelected,
      isAdditionalSelected,
      isRotated90,
      isRotated180,
      isRotated270,

      port: PORT,

      clicked,
      dragStarted,
      filename,
    };
  }
});
</script>
<template>
  <div
    draggable="true"
    class="image-box"
    :class="{ selected: isPrimarySelected, 'additional-selected': isAdditionalSelected }"
    @dragstart="dragStarted($event)"
    @click="clicked($event)"
  >
    <div class="nested" ref="nestedRef">
      <div class="image-wrapper" :style="imageWrapperStyle" v-if="imageData.previewSize">
        <img :style="imageStyle" :src="'http://localhost:' + port + '/images/' + imageData.uid" />
      </div>
    </div>
    <div class="metadata">
      <div class="ib-label" v-if="!isShortVersion">
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
    <div
      class="title"
      :class="{['has-text-label-' + labelNames[imageData.label]]: isShortVersion, ['short-version'] : isShortVersion}"
    >{{ filename(imageData.filePath) }}</div>
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

    &.short-version {
      font-size: 10px;
    }
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
import { defineComponent, computed, SetupContext, reactive, ref, onMounted, watch } from '@vue/composition-api';
import { PORT } from '@/backend/api';
import { Label, ImageAdjustments, Rotation, Rating } from '@/store/schema';


export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageData {
  readonly uid: string;
  readonly filePath: string;
  readonly previewSize?: ImageSize;
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
  readonly shortVersion: boolean;
  readonly size: number;
}

export default defineComponent({
  props: {
    imageData: {
      type: Object,
      required: true,
    },
    shortVersion: {
      type: Boolean,
      default: false,
    },
    size: {
      type: Number,
      default: 0,
    }
  },
  setup(props: Props, context: SetupContext) {
    const nestedRef = ref<HTMLDivElement>(undefined);

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

    const nestedSize = reactive({
      width: 0,
      height: 0,
    })

    const isPrimarySelected = computed(() => props.imageData.selectionType === SelectionType.PRIMARY);
    const isAdditionalSelected = computed(() => props.imageData.selectionType === SelectionType.ADDITIONAL);
    const isRotated90 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_90);
    const isRotated180 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_180);
    const isRotated270 = computed(() => props.imageData.adjustments.rotation === Rotation.DEG_270);
    const isShortVersion = computed(() => props.shortVersion);

    const imageWrapperStyle = computed(() => {
      if (!props.imageData.previewSize) {
        return {};
      }

      let ratio = props.imageData.previewSize.width / props.imageData.previewSize.height;
      if (isRotated90.value || isRotated270.value) {
        ratio = 1 / ratio;
      }
      let width = nestedSize.width || 1;
      let height = nestedSize.height || 1;
      if (ratio >= 1) {
        height = width / ratio;
      } else {
        width = height / ratio;
      }

      // console.log(['clientWidth', nestedSize.width, 'clientHeight', nestedSize.height, 'width', width, 'height', height]);
      return { width: `${width}px`, height: `${height}px` };
    });

    const imageStyle = computed(() => {
      if (!props.imageData.previewSize) {
        return {};
      }

      let scale = 1;
      if (isRotated90.value || isRotated270.value) {
        scale = props.imageData.previewSize.height / props.imageData.previewSize.width;
      }
      return {
        transform: `rotate(${props.imageData.adjustments.rotation}deg) scale(${scale})`,
      };
    });

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

    function resize() {
      if (!nestedRef.value) {
        return;
      }
      nestedSize.width = nestedRef.value.clientWidth;
      nestedSize.height = nestedRef.value.clientHeight;
    }

    const size = computed(() => props.size);
    onMounted(resize);
    watch(size, resize);

    return {
      nestedRef,
      nestedSize,

      labelNames,

      isPrimarySelected,
      isAdditionalSelected,
      isRotated90,
      isRotated180,
      isRotated270,
      isShortVersion,
      imageWrapperStyle,
      imageStyle,

      port: PORT,

      clicked,
      dragStarted,
      filename,
    };
  }
});
</script>
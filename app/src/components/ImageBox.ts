import { defineComponent, computed, SetupContext, reactive, ref, onMounted, watch } from '@vue/composition-api';
import { Label, ImageAdjustments, Rotation, Rating } from '@/store/schema';


export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageData {
  readonly uid: string;
  readonly filePath: string;
  readonly previewSize?: ImageSize;
  readonly previewUrl: string;
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

export interface Props {
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
    const nestedRef = ref<HTMLDivElement>();

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

      let width = props.imageData.previewSize.width || 1;
      let height = props.imageData.previewSize.height || 1;
      if (isRotated90.value || isRotated270.value) {
        let t = height;
        height = width;
        width = t;
      }
      if (width > nestedSize.width) {
        const m = nestedSize.width / width;
        width *= m;
        height *= m;
      }
      if (height > nestedSize.height) {
        const m = nestedSize.height / height;
        width *= m;
        height *= m;
      }

      return { width: `${width}px`, height: `${height}px` };
    });

    const imageStyle = computed(() => {
      if (!props.imageData.previewSize) {
        return {};
      }

      let scale = 1;
      let translate = '';
      let transformOrigin = 'initial';
      if (isRotated90.value || isRotated270.value) {
        scale = props.imageData.previewSize.width / props.imageData.previewSize.height;
        if (scale < 1) {
          scale = 1 / scale;
        }
        transformOrigin = 'top right';
        if (isRotated90.value) {
          translate = 'translateX(100%)';
        } else if (isRotated270.value) {
          translate = 'translateY(-100%)';
        }
      }
      return {
        'transform-origin': transformOrigin,
        transform: `rotate(${props.imageData.adjustments.rotation}deg) scale(${scale}) ${translate}`,
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

      clicked,
      dragStarted,
      filename,
    };
  }
});
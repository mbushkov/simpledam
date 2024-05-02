import { Rotation, type ImageAdjustments } from "@/store/schema";
import { computed, defineComponent, type SetupContext } from "vue";


export interface Props {
  readonly url: string;
  readonly adjustments: ImageAdjustments;
}

export default defineComponent({
  props: {
    url: {
      type: String,
      required: true,
    },
    adjustments: {
      type: Object as () => ImageAdjustments,
      required: true,
    },
  },  
  setup(props: Props, context: SetupContext) {
    const isRotated90 = computed(() => props.adjustments.rotation === Rotation.DEG_90);
    const isRotated180 = computed(() => props.adjustments.rotation === Rotation.DEG_180);
    const isRotated270 = computed(() => props.adjustments.rotation === Rotation.DEG_270);

    return {
      isRotated90,
      isRotated180,
      isRotated270,
    };
  }
});  
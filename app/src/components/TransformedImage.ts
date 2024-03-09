import { ImageAdjustments, Rotation } from "@/store/schema";
import { SetupContext, computed, defineComponent } from "vue";


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
import { computed, defineComponent } from "vue";
import Icon from "./Icon";

export interface Props {
  readonly max: number;
  readonly value: number;
  readonly size?: string;
  readonly iconPack?: string;
  readonly icon: string;
}

export default defineComponent({
  components: { Icon },

  props: {
    max: {
      type: Number,
      default: 5,
    },
    value: {
      type: Number,
      default: 0,
    },
    size: {
      type: String,
    },
    iconPack: {
      type: String,
    },
    icon: {
      type: String,
      default: 'star',
    }
  },

  setup(props: Props) {
    const rateStyles = computed(() => {
      const result = [];
      for (let i = 1; i <= props.max; ++i) {
        if (i <= props.value) {
          result.push('set-on');
        } else {
          result.push('');
        }
      }

      return result;
    });

    return {
      rateStyles,
    };
  }
})
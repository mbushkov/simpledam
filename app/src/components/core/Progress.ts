import { computed, defineComponent } from "vue";

export interface Props {
  readonly size?: string;
  readonly max?: number;
  readonly format?: string;
  readonly value?: number;
}

export default defineComponent({
  props: {
    size: String,
    value: {
      type: Number,
      default: undefined
    },
    max: {
      type: Number,
      default: 100
    },

    format: {
      type: String,
      default: 'raw',
      validator: (value: string) => {
        return [
          'raw',
          'percent'
        ].indexOf(value) >= 0
      }
    },
  },
  setup(props: Props) {
    const label = computed(() => {
      if (props.value === undefined || isNaN(props.value)) {
        return '';
      }

      if (props.format === 'percent') {
        return new Intl.NumberFormat(
          undefined,
          {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }
        ).format(props.value / (props.max ?? 100));
      } else {
        return props.value.toString();
      }
    });

    return {
      label,
    };
  }
});
import { computed, defineComponent } from "@vue/composition-api";

export interface Props {
  readonly type?: string;
  readonly icon: string;
  readonly size?: string;
}

export default defineComponent({
  props: {
    type: {
      type: String,
    },
    icon: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    }
  },
  setup(props: Props) {
    const prefix = 'mdi-';

    const iconType = computed(() => {
      if (!props.type) {
        return '';
      }

      const components = props.type.split('-');
      if (components.length <= 1) {
        return '';
      }

      const [, ...allButFirst] = components;
      return `has-text-${allButFirst.join('-')}`;
    });

    const iconName = computed(() => {
      return `${prefix}${props.icon}`;
    });

    const iconSize = computed(() => {
      return props.size ?? '';
    });

    const iconCustomSize = computed(() => {
      switch (props.size) {
        case 'is-small':
          return null;
        case 'is-medium':
          return 'mdi-36px';
        case 'is-larger':
          return 'mdi-48px';
        default:
          return 'mdi-24px';
      }
    });

    return {
      iconType,
      iconName,
      iconSize,
      iconCustomSize,
    };
  }
})
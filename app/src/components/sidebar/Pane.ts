import { defineComponent, } from '@vue/composition-api';
import Icon from '@/components/core/Icon.vue';

export interface Props {
  readonly title: string;
}

export default defineComponent({
  components: {
    Icon,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  setup() {
    return {
    };
  }
});
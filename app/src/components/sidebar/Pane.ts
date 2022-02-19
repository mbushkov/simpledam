import { defineComponent, } from '@vue/composition-api';
import Icon from '@/components/core/Icon.vue';
import Collapse from '@/components/core/Collapse.vue';

export interface Props {
  readonly title: string;
}

export default defineComponent({
  components: {
    Icon,
    Collapse,
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
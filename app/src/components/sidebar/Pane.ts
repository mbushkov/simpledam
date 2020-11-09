import { defineComponent, } from '@vue/composition-api';

// interface Props {
//   readonly title: string;
// }

export default defineComponent({
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
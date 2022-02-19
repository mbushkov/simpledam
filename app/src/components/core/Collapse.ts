import { computed, defineComponent, ref } from "vue";
import Icon from '@/components/core/Icon.vue';

export interface Props {
  value?: boolean;
  title?: string;
}

export default defineComponent({
  components: {
    Icon,
  },
  props: {
    value: {
      type: Boolean,
    },
    title: {
      type: String,
    },
  },
  emits: ['input'],
  setup(props: Props, { emit }) {
    const _inputValue = ref<Boolean>(true);

    const inputValue = computed({
      get: () => _inputValue.value,
      set: val => {
        _inputValue.value = val;
        emit('input', val);
      }
    });

    function toggle() {
      inputValue.value = !inputValue.value;
    }

    return {
      inputValue,
      toggle,
    }
  }
});

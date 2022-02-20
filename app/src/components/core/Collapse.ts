import { computed, defineComponent, ref, watchEffect } from "vue";
import Icon from '@/components/core/Icon.vue';

export interface Props {
  modelValue?: boolean;
  title?: string;
}

export default defineComponent({
  components: {
    Icon,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
    },
  },
  emits: ['update:modelValue'],
  setup(props: Props, { emit }) {
    const _inputValue = ref<Boolean>(true);

    const inputValue = computed({
      get: () => _inputValue.value,
      set: val => {
        _inputValue.value = val;
        emit('update:modelValue', val);
      }
    });

    watchEffect(() => {
      _inputValue.value = props.modelValue ?? true;
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

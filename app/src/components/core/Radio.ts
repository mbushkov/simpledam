import { computed, defineComponent, ref, watchEffect } from "vue";

type ValueType = string | number | boolean | undefined;

export interface Props {
  readonly modelValue?: ValueType;
  readonly nativeValue?: ValueType;
  readonly type?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly name?: string;
  readonly size?: string;
}

export default defineComponent({
  props: {
    modelValue: {
      type: [String, Number, Boolean],
    },
    nativeValue: {
      type: [String, Number, Boolean],
    },
    type: {
      type: String,
    },
    disabled: {
      type: Boolean,
    },
    required: {
      type: Boolean,
    },
    name: {
      type: String,
    },
    size: {
      type: String,
    }
  },
  emits: ['update:modelValue'],
  setup(props: Props, { emit }) {
    const _inputValue = ref<ValueType>();

    const inputValue = computed({
      get: () => _inputValue.value,
      set: val => {
        _inputValue.value = val;
        emit('update:modelValue', val);
      }
    });

    const input = ref<HTMLInputElement>();

    watchEffect(() => {
      _inputValue.value = props.modelValue;
    });

    function focus() {
      // MacOS FireFox and Safari do not focus when clicked
      input.value?.focus();
    }

    return {
      inputValue,
      input,

      focus,
    };
  }
});
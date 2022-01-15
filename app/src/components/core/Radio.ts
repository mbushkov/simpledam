import { computed, defineComponent, ref, watchEffect } from "@vue/composition-api";

type ValueType = string | number | boolean | undefined;

export interface Props {
  readonly value?: ValueType;
  readonly nativeValue?: ValueType;
  readonly type?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly name?: string;
  readonly size?: string;
}

export default defineComponent({
  props: {
    value: {
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
  emits: ['input'],
  setup(props: Props, { emit }) {
    const _inputValue = ref<ValueType>();

    const inputValue = computed({
      get: () => _inputValue.value,
      set: val => {
        _inputValue.value = val;
        console.log('val', val);
        emit('input', val);
      }
    });

    const input = ref<HTMLInputElement>();

    watchEffect(() => {
      _inputValue.value = props.value;
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
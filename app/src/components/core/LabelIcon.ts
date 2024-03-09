import { Label } from "@/store/schema";
import { defineComponent } from "vue";
import Icon from "./Icon";

export interface Props {
  readonly value: number;
}

const labelNames: {[key: number]: string} = {
  [Label.NONE]: 'none',
  [Label.RED]: 'red',
  [Label.GREEN]: 'green',
  [Label.BLUE]: 'blue',
  [Label.BROWN]: 'brown',
  [Label.MAGENTA]: 'magenta',
  [Label.ORANGE]: 'orange',
  [Label.YELLOW]: 'yellow',
  [Label.CYAN]: 'cyan',
  [Label.GRAY]: 'gray',
};

export default defineComponent({
  components: { Icon },

  props: {
    value: {
      type: Number,
      default: 0,
    },
  },

  setup(props: Props) {
    return {
      labelNames,
    };
  }
})
import { defineComponent } from '@vue/composition-api';
import LabelsPane from './LabelsPane.vue';
import RatingsPane from './RatingsPane.vue';
import PathsPane from './PathsPane.vue';

export default defineComponent({
  // type inference enabled
  components: {
    LabelsPane,
    RatingsPane,
    PathsPane,
  },
  setup() {

    return {
    };
  }
});
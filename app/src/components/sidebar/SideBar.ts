import { defineComponent } from 'vue';
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
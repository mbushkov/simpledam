import { backendMirrorSingleton } from '@/backend/backend-mirror';
import { transientStoreSingleton } from '@/store';
import { defineComponent } from '@vue/composition-api';
import Progress from '@/components/core/Progress.vue';

export default defineComponent({
  components: {
    Progress,
  },
  setup() {
    return {
      transientStoreState: transientStoreSingleton().state,
      backendState: backendMirrorSingleton().state,
    }
  }
});
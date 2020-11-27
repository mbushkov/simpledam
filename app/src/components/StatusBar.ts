import { backendMirrorSingleton } from '@/backend/backend-mirror';
import { transientStoreSingleton } from '@/store';
import { defineComponent } from '@vue/composition-api';


export default defineComponent({
  setup() {

    return {
      transientStoreState: transientStoreSingleton().state,
      backendState: backendMirrorSingleton().state,
    }
  }
});
import { defineComponent } from '@vue/composition-api';

import { backendMirrorSingleton } from '@/backend/backend-mirror';

export default defineComponent({
  setup() {

    return {
      backendState: backendMirrorSingleton().state,
    }
  }
});
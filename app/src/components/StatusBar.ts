import { defineComponent } from '@vue/composition-api';

import { BACKEND_MIRROR } from '@/backend/backend-mirror';

export default defineComponent({
  setup() {

    return {
      backendState: BACKEND_MIRROR.state,
    }
  }
});
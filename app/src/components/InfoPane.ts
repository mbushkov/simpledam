import Pane from "@/components/sidebar/Pane.vue";
import { storeSingleton } from '@/store';
import { computed, defineComponent } from 'vue';

export default defineComponent({
  components: {
    Pane,
  },
  setup() {
    const store = storeSingleton();

    const selectedImageData = computed(() => {
      const primaryId = store.state.selection.primary;
      if (primaryId === undefined) {
        return undefined;
      }

      const imageData = store.state.images[primaryId];
      console.log(imageData);
      return imageData;
    });

    const formatDate = (utcMilliseconds:number):string => {
      const d = new Date(utcMilliseconds);
      return `${d.getFullYear()}-${d.getMonth().toString().padStart(2, "0")}-${d.getMinutes().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}-${d.getSeconds().toString().padStart(2, "0")} UTC`;
    }

    return {
      selectedImageData,
      formatDate,
    }
  }
});
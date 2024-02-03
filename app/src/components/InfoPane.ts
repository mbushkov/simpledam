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
      return imageData;
    });

    const selectedExifData = computed(() => {
      if (selectedImageData.value === undefined) {
        return [];
      }

      return Object.entries(selectedImageData.value.exif_data).map(([k, v]) => [k, v.value]);
    });

    const selectedXmpData = computed(() => {
      if (selectedImageData.value === undefined) {
        return [];
      }

      return Object.entries(selectedImageData.value.xmp_data).map(([k, v]) => [k, v.value]);
    });

    const selectedIptcData = computed(() => {
      if (selectedImageData.value === undefined) {
        return [];
      }

      return Object.entries(selectedImageData.value.iptc_data).map(([k, v]) => [k, v.value]);
    });    

    const formatDate = (utcMilliseconds:number):string => {
      const d = new Date(utcMilliseconds);
      return `${d.getFullYear()}-${d.getMonth().toString().padStart(2, "0")}-${d.getMinutes().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}-${d.getSeconds().toString().padStart(2, "0")} UTC`;
    }

    return {
      selectedImageData,
      selectedExifData,
      selectedXmpData,
      selectedIptcData,
      formatDate,
    }
  }
});
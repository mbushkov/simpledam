import { PORT } from '@/backend/api';
import LabelIcon from '@/components/core/LabelIcon.vue';
import Rating from '@/components/core/Rating.vue';
import { storeSingleton } from '@/store';
import { ImageAdjustments, InferredImageMetadata, ListColumn } from '@/store/schema';
import { computed, defineComponent } from 'vue';
import TransformedImage from './TransformedImage.vue';

interface ValueColumn extends ListColumn {
  value: string|number;
}

interface Row {
  key: string;
  previewUrl: string;
  previewAdjustments: ImageAdjustments;
  columns: ValueColumn[];
}

interface Props {
  readonly uid: string;
  readonly maxSize: number;
}

export default defineComponent({
  components: {
    Rating,
    LabelIcon,
    TransformedImage,
  },
  props: {
    uid: {
      type: String,
      required: true,
    },
    maxSize: {
      type: Number,
      required: true,
    },
  },
  setup(props: Props) {
    const store = storeSingleton();
   
    const row = computed(():Row => {
      const imageData = store.state.images[props.uid];
      const metadata = store.state.metadata[props.uid];
      const inferredMetadata: InferredImageMetadata = {
        rating: metadata.rating,
        label: metadata.label,
        width: imageData.size.width,
        height: imageData.size.height,
        dpi: 0,
        fileName: imageData.path.split('/').pop()!,
        filePath: imageData.path,
        fileSize: imageData.file_size,
        fileCtime: imageData.file_ctime,
        fileMtime: imageData.file_mtime,
        fileColorTag: imageData.file_color_tag,
        iccProfileDescription: imageData.icc_profile_description,
        mimeType: imageData.mime_type,
        author: '',  // TODO: add support
        originTime: imageData.file_ctime,  // TODO: add support
        captureDevice: '',  // TODO: add support
        country: '',  // TODO: add support
        city: '',  // TODO: add support
      }

      return {
        key: `list-${props.uid}`,
        previewUrl: 'http://localhost:' + PORT + '/images/' + props.uid,
        previewAdjustments: metadata.adjustments,
        columns: store.state.listSettings.columns.map((col):ValueColumn => {
          return {
            ...col,
            value: col.name !== 'preview' ? inferredMetadata[col.name] : '',
          };
        })
      };
    });

    const rowStyle = computed(() => ({
      'height': `${props.maxSize}px`,
    }));

    const isPrimarySelected = computed(() => store.state.selection.primary == props.uid);
    const isAdditionalSelected = computed(() => store.state.selection.additional[props.uid] !== undefined);

    return {
      row,
      rowStyle,
      isPrimarySelected,
      isAdditionalSelected,
    };
  }
});
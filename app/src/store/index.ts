import { Store } from './store';
import { TransientStore } from './transient-store';
import { apiService } from '@/backend/api';

export { Direction } from './store';
export { ImageViewerTab } from './transient-store';

export const TRANSIENT_STORE = new TransientStore();
export const STORE = new Store(TRANSIENT_STORE, apiService());

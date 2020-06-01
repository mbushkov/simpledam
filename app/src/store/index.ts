import { Store } from './store';
import { TransientStore } from './transient-store';
import { API_SERVICE } from '@/backend/api';

export const TRANSIENT_STORE = new TransientStore();
export const STORE = new Store(TRANSIENT_STORE, API_SERVICE);

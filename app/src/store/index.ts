import { Store } from './store';
import { TransientStore } from './transient-store';
import { apiServiceSingleton } from '@/backend/api';

export { Direction } from './store';
export { ImageViewerTab } from './transient-store';

let _transientStore: TransientStore | undefined;
export function transientStoreSingleton(): TransientStore {
  if (!_transientStore) {
    _transientStore = new TransientStore();
  }
  return _transientStore;
}

let _store: Store | undefined;
export function storeSingleton(): Store {
  if (!_store) {
    _store = new Store(transientStoreSingleton(), apiServiceSingleton());
  }
  return _store;
}

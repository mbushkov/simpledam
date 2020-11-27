import { Store } from './store';
import { TransientStore } from './transient-store';

export { Direction } from './store';
export { ImageViewerTab } from './transient-store';

let _transientStoreSingleton: TransientStore | undefined;
export function transientStoreSingleton(): TransientStore {
  if (!_transientStoreSingleton) {
    throw new Error('transientStoreSingleton not set');
  }

  return _transientStoreSingleton;
}

export function setTransientStoreSingleton(value: TransientStore) {
  _transientStoreSingleton = value;
}

let _storeSingleton: Store | undefined;
export function storeSingleton(): Store {
  if (!_storeSingleton) {
    throw new Error('storeSingleton not set');
  }

  return _storeSingleton;
}

export function setStoreSingleton(value: Store) {
  _storeSingleton = value;
}

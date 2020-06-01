import { Immutable } from '@/lib/type-utils';

import { State } from './version_0001';
export * from './version_0001';

export type ReadonlyState = Immutable<State>;

import Migration0001to0002 from '@/store/migrations/migration_0001_to_0002';
import Migration0002to0003 from '@/store/migrations/migration_0002_to_0003';
import { State as LastState } from '@/store/schema';
import { State as State0001 } from '@/store/schema/version_0001';
import { State as State0002 } from '@/store/schema/version_0002';
import { State as State0003 } from '@/store/schema/version_0003';

export type HistoricalState = State0001 | State0002 | State0003;

export function Migrate(state: HistoricalState): LastState {
  if (state.version === 1) {
    state = Migration0001to0002(state);
  }
  if (state.version === 2) {
    state = Migration0002to0003(state);
  }
  if (state.version === 3) {
    // Current state;
    return state;
  }
  throw new Error('unreachable');
}
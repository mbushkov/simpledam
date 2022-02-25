import { State as State0001 } from '@/store/schema/version_0001';
import { State as State0002 } from '@/store/schema/version_0002';
import { State as LastState } from '@/store/schema'
import Migration0001to0002 from '@/store/migrations/migration_0001_to_0002';

export type HistoricalState = State0001 | State0002;

export function Migrate(state: HistoricalState): LastState {
  if (state.version === 1) {
    state = Migration0001to0002(state);
  }
  if (state.version === 2) {
    // Current state;
    return state;
  }
  throw new Error('unreachable');
}
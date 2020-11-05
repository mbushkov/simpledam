import { storeSingleton } from '@/store';
import { Label } from "@/store/schema";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function labelAction(label: Label): Action {
  return {
    name: `Label${capitalize(Label[label])}`,
    title: `Label with ${capitalize(Label[label])}`,

    async perform(): Promise<void> {
      storeSingleton().labelSelection(label);
    }
  }
}

export function labelActions(): ReadonlyArray<Action> {
  const result: Action[] = [];
  for (const value in Label) {
    const n = Number.parseInt(value);
    if (!Number.isNaN(n)) {
      result.push(labelAction(n));
    }
  }
  return result;
}

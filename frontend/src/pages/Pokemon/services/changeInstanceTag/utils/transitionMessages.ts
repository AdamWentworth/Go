// transitionMessages.ts

import { PokemonInstance } from '@/types/pokemonInstance';

// 1. A utility to figure out the status string from your ownership fields.
import type { InstanceStatus } from '@/types/instances';

export function getStatusFromInstance(instance: PokemonInstance): InstanceStatus {
  if (instance.is_unowned) return 'Unowned';
  if (instance.is_for_trade) return 'Trade';
  if (instance.is_wanted) return 'Wanted';
  if (instance.is_owned) return 'Owned';
  return 'Unowned';
}

// 2. A dictionary of messages for each (from → to) combination.
type TransitionFunction = (name: string) => string;

type TransitionMessageMap = {
  [from in Exclude<InstanceStatus, 'Unknown'>]?: {
    [to in Exclude<InstanceStatus, 'Unknown'>]?: TransitionFunction;
  };
};

const MESSAGES: TransitionMessageMap = {
  Owned: {
    Trade: (name) => `List ${name} for Trade?`,
    Wanted: (name) => `Create a duplicate ${name} for your Wanted list?`,
    Unowned: (name) => `Transfer ${name}?`,
  },
  Trade: {
    Owned: (name) => `Remove ${name} from Trade Listing?`,
    Wanted: (name) => `Create a duplicate ${name} for your Wanted list?`,
    Unowned: (name) => `Transfer ${name}?`,
  },
  Wanted: {
    Owned: (name) => `Caught ${name}?`,
    Trade: (name) => `Caught ${name} and list for Trade?`,
    Unowned: (name) => `Transfer ${name}?`,
  },
  Unowned: {
    Owned: (name) => `Caught ${name}?`,
    Trade: (name) => `Caught ${name} and list for Trade?`,
    Wanted: (name) => `List ${name} as Wanted?`,
  },
};

// 3. Function to return a custom transition message or a fallback
export function getTransitionMessage(
  fromStatus: InstanceStatus,
  toStatus: InstanceStatus,
  displayName: string
): string {
  const fromMap = MESSAGES[fromStatus as keyof typeof MESSAGES];
  const transitionFn = fromMap?.[toStatus as keyof typeof fromMap];

  if (transitionFn) {
    return transitionFn(displayName);
  }

  return `Move ${displayName} from ${fromStatus} to ${toStatus}`;
}

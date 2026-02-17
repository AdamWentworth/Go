// src/types/instances.ts

import type { PokemonInstance } from './pokemonInstance';

/* -------------------------------------------------------------------------- */
/*  Instance-centric helpers                                                 */
/* -------------------------------------------------------------------------- */

export type InstanceStatus = 'Caught' | 'Trade' | 'Wanted' | 'Missing';

export type Instances        = Record<string, PokemonInstance>;
export type MutableInstances = Record<string, Partial<PokemonInstance>>;

/* async helpers ----------------------------------------------------------- */
export type UpdateInstanceStatusFn = (
  instanceIds: string | string[],
  newStatus: InstanceStatus
) => Promise<void>;

export type UpdateInstanceDetailsFn = (
  keysOrObject: string | string[] | Record<string, PokemonInstance>,
  details?: Record<string, PokemonInstance>
) => Promise<void>;

export type SetInstancesFn = (
  updater: (
    prevData: { instances: MutableInstances }
  ) => { instances: MutableInstances }
) => void;

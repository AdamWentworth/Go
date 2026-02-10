import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

function shallowEqualInstance(a: PokemonInstance, b: PokemonInstance): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if ((a as any)[key] !== (b as any)[key]) return false;
  }
  return true;
}

export function areInstancesEqual(a: Instances, b: Instances): boolean {
  if (a === b) return true;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const id of aKeys) {
    const aRow = a[id];
    const bRow = b[id];
    if (!bRow) return false;
    if (!shallowEqualInstance(aRow, bRow)) return false;
  }

  return true;
}


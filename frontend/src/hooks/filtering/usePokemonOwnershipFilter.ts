// usePokemonOwnershipFilter.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonInstance } from '@/types/pokemonInstance';

// Base filters the UI should treat as parents
const VALID_FILTERS = ['caught', 'wanted'] as const;
export type OwnershipFilter = typeof VALID_FILTERS[number];

// Derived (children) – treat 'trade' like 'favorites' / 'most wanted'
const SPECIAL_FILTERS = ['favorites', 'most wanted', 'trade'] as const;
type SpecialFilter = typeof SPECIAL_FILTERS[number];

export function getFilteredPokemonsByOwnership(
  variants: PokemonVariant[],
  instancesData: Instances,
  filter: string,
  tagBuckets: TagBuckets
) {
  const normalizedFilter = (filter || '').toLowerCase().trim();
  if (normalizedFilter === 'missing') {
    return [] as Array<PokemonVariant & { instanceData: PokemonInstance }>;
  }

  const variantsByKey = new Map<string, PokemonVariant>();
  for (const variant of variants) {
    const key = String((variant as any).variant_id ?? '');
    if (key) variantsByKey.set(key, variant);

    // Keep legacy lookup while pokemonKey -> variant_id migration finishes.
    const legacyKey = String((variant as any).pokemonKey ?? '');
    if (legacyKey && !variantsByKey.has(legacyKey)) {
      variantsByKey.set(legacyKey, variant);
    }
  }

  // helper: instance_ids -> hydrated rows
  const mapIds = (ids: string[]) => {
    const mapped: Array<PokemonVariant & { instanceData: PokemonInstance }> = [];

    for (const instanceId of ids) {
      const instance = instancesData[instanceId];
      if (!instance) continue;

      const variantKey = String((instance as any).variant_id ?? (instance as any).pokemonKey ?? '');
      if (!variantKey) continue;

      const variant = variantsByKey.get(variantKey);
      if (!variant) continue;

      mapped.push({
        ...variant,
        instanceData: { ...instance, instance_id: instanceId } as PokemonInstance,
      });
    }

    return mapped;
  };

  // ---- derived children ----
  if ((normalizedFilter as SpecialFilter) === 'favorites') {
    const bucket = tagBuckets.caught ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).favorite)
      .map(([id]) => id);
    return mapIds(ids);
  }

  if ((normalizedFilter as SpecialFilter) === 'most wanted') {
    const bucket = tagBuckets.wanted ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).most_wanted)
      .map(([id]) => id);
    return mapIds(ids);
  }

  if ((normalizedFilter as SpecialFilter) === 'trade') {
    // ✅ Trade is derived strictly from Caught
    const bucket = tagBuckets.caught ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).is_for_trade)
      .map(([id]) => id);
    return mapIds(ids);
  }

  // ---- base parents ----
  const filterKey = normalizedFilter as OwnershipFilter;
  if (!VALID_FILTERS.includes(filterKey)) {
    console.warn(`[usePokemonOwnershipFilter] Unknown filter "${filter}". Returning empty array.`);
    return [];
  }

  const bucket = tagBuckets[filterKey] ?? {};
  return mapIds(Object.keys(bucket));
}

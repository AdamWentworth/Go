// src/hooks/filtering/usePokemonOwnershipFilter.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonInstance } from '@/types/pokemonInstance';

// Valid filters we expose in the Tags UI
const VALID_FILTERS = ['caught', 'trade', 'wanted'] as const;
export type OwnershipFilter = typeof VALID_FILTERS[number];

// Derived tag filters (computed from base buckets)
const SPECIAL_FILTERS = ['favorites', 'most wanted'] as const;
type SpecialFilter = typeof SPECIAL_FILTERS[number];

// Backward-compat aliases
const FILTER_ALIASES: Record<string, OwnershipFilter | 'missing'> = {
  owned: 'caught',
  unowned: 'missing', // kept to avoid breaking old links; we'll treat it as empty
};

export function getFilteredPokemonsByOwnership(
  variants: PokemonVariant[],
  instancesData: Instances,
  filter: string,
  tagBuckets: TagBuckets
) {
  const raw = (filter || '').toLowerCase().trim();
  const mapped = FILTER_ALIASES[raw] ?? raw;
  if (mapped === 'missing') {
    // No longer a public bucket in Tags; return empty list silently.
    return [] as Array<PokemonVariant & { instanceData: PokemonInstance }>;
  }

  // helper to map instance_ids -> hydrated variant+instance rows
  const mapIds = (ids: string[]) =>
    ids
      .map((instanceId) => {
        const instance = instancesData[instanceId];
        if (!instance) return undefined;

        const variantKey = instance.variant_id;
        if (!variantKey) return undefined;

        const variant = variants.find((v) => (v as any).variant_id === variantKey);
        if (!variant) return undefined;

        return { ...variant, instanceData: { ...instance, instance_id: instanceId } as PokemonInstance };
      })
      .filter((v): v is PokemonVariant & { instanceData: PokemonInstance } => v !== undefined);

  // Derived filters
  if ((mapped as SpecialFilter) === 'favorites') {
    const bucket = tagBuckets.caught ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).favorite)
      .map(([id]) => id);
    return mapIds(ids);
  }
  if ((mapped as SpecialFilter) === 'most wanted') {
    const bucket = tagBuckets.wanted ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).most_wanted)
      .map(([id]) => id);
    return mapIds(ids);
  }

  // Base buckets
  const filterKey = mapped as OwnershipFilter;

  if (!VALID_FILTERS.includes(filterKey)) {
    console.warn(`[usePokemonOwnershipFilter] Unknown filter "${filter}". Returning empty array.`);
    return [];
  }

  const bucket = tagBuckets[filterKey] ?? {};
  return mapIds(Object.keys(bucket));
}

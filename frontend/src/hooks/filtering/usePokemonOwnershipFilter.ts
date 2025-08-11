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

// Back-compat
const FILTER_ALIASES: Record<string, OwnershipFilter | 'missing'> = {
  owned: 'caught',
  unowned: 'missing',
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
    return [] as Array<PokemonVariant & { instanceData: PokemonInstance }>;
  }

  // helper: instance_ids -> hydrated rows
  const mapIds = (ids: string[]) =>
    ids
      .map((instanceId) => {
        const instance = instancesData[instanceId];
        if (!instance) return undefined;
        const variantKey = instance.variant_id;
        if (!variantKey) return undefined;
        const variant = variants.find((v) => (v as any).variant_id === variantKey);
        if (!variant) return undefined;
        return {
          ...variant,
          instanceData: { ...instance, instance_id: instanceId } as PokemonInstance,
        };
      })
      .filter((v): v is PokemonVariant & { instanceData: PokemonInstance } => v !== undefined);

  // ---- derived children ----
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

  if ((mapped as SpecialFilter) === 'trade') {
    // ✅ Trade is derived strictly from Caught
    const bucket = tagBuckets.caught ?? {};
    const ids = Object.entries(bucket)
      .filter(([, item]) => (item as any).is_for_trade)
      .map(([id]) => id);
    return mapIds(ids);
  }

  // ---- base parents ----
  const filterKey = mapped as OwnershipFilter;
  if (!VALID_FILTERS.includes(filterKey)) {
    console.warn(`[usePokemonOwnershipFilter] Unknown filter "${filter}". Returning empty array.`);
    return [];
  }

  const bucket = tagBuckets[filterKey] ?? {};
  return mapIds(Object.keys(bucket));
}

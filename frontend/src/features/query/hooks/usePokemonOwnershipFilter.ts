// src/hooks/filtering/usePokemonOwnershipFilter.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonInstance } from '@/types/pokemonInstance';

const VALID_FILTERS = ['caught', 'trade', 'wanted', 'missing'] as const;
export type OwnershipFilter = typeof VALID_FILTERS[number];

// Backward-compat aliases (old → new)
const FILTER_ALIASES: Record<string, OwnershipFilter> = {
  owned: 'caught',
  unowned: 'missing',
};

export function getFilteredPokemonsByOwnership(
  variants: PokemonVariant[],
  instancesData: Instances,
  filter: string,
  tagBuckets: TagBuckets
): Array<PokemonVariant & { instanceData: PokemonInstance }> {
  const raw = (filter || '').toLowerCase().trim();
  const filterKey = (FILTER_ALIASES[raw] ?? raw) as OwnershipFilter;

  if (!VALID_FILTERS.includes(filterKey)) {
    console.warn(`[usePokemonOwnershipFilter] Unknown filter "${filter}". Returning empty array.`);
    return [];
  }

  const bucket = tagBuckets[filterKey] ?? {};
  const instanceIds = Object.keys(bucket); // keys are instance_id (UUID)

  return instanceIds
    .map((instanceId) => {
      const instance = instancesData[instanceId];
      if (!instance) return undefined;

      const variantKey = instance.variant_id; // e.g. "0583-default" or "0583-shiny"
      if (!variantKey) return undefined;

      const variant = variants.find((v) => v.pokemonKey === variantKey);
      if (!variant) return undefined;

      // Keep variant.pokemonKey as the canonical variant key.
      // Consumers can use instanceData.instance_id when they need the UUID.
        return {
        ...variant,
        pokemonKey: variantKey,
        instanceData: {
          ...instance,
          instance_id: instanceId,
        } as PokemonInstance,
      };
    })
    .filter(
      (v): v is PokemonVariant & { instanceData: PokemonInstance } =>
        v !== undefined
    );
}

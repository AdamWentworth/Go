// src/hooks/filtering/usePokemonOwnershipFilter.ts

import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonInstance } from '@/types/pokemonInstance';

const VALID_FILTERS = ['owned', 'trade', 'wanted', 'unowned'] as const;
export type OwnershipFilter = typeof VALID_FILTERS[number];

export function getFilteredPokemonsByOwnership(
  variants: PokemonVariant[],
  instancesData: Instances,
  filter: string,
  tagBuckets: TagBuckets
): Array<PokemonVariant & { instanceData: PokemonInstance }> {
  const filterKey = filter.toLowerCase() as OwnershipFilter;

  if (!VALID_FILTERS.includes(filterKey)) {
    console.warn(`Unknown filter: ${filter}. Returning empty array.`);
    return [];
  }

  const bucket = tagBuckets[filterKey] ?? {};
  const filteredKeys = Object.keys(bucket);

  return filteredKeys
    .map((fullKey) => {
      // use reusable parser to split off UUID suffix if present
      const { baseKey } = parsePokemonKey(fullKey);

      const variant = variants.find((v) => v.pokemonKey === baseKey);
      const instance = instancesData[fullKey];

      if (variant && instance) {
        return {
          ...variant,
          // override pokemonKey so it includes the UUID suffix
          pokemonKey: fullKey,
          instanceData: instance,
        };
      }
      return undefined;
    })
    .filter(
      (v): v is PokemonVariant & { instanceData: PokemonInstance } =>
        v !== undefined
    );
}

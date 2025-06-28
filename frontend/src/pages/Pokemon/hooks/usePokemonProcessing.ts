// usePokemonProcessing.ts

import { useMemo } from 'react';
import useQueryPokemons from '@/features/query/hooks/useQueryPokemons';
import useSortManager from '../../../hooks/sort/useSortManager';
import { getFilteredPokemonsByOwnership } from '@/features/query/hooks/usePokemonOwnershipFilter';

// ——— Your real types ———
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances, InstanceStatus } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { SortType, SortMode } from '@/types/sort';
// ——————————————————–

interface UsePokemonProcessingResult {
  filteredVariants: PokemonVariant[];
  sortedPokemons: PokemonVariant[];
}

function usePokemonProcessing(
  variants: PokemonVariant[],
  instancesData: Instances,
  instanceStatus: InstanceStatus | null,
  tagBuckets: TagBuckets,
  searchTerm: string,
  showEvolutionaryLine: boolean,
  sortType: SortType,
  sortMode: SortMode
): UsePokemonProcessingResult {

  // ownership‑style filtering via your new InstancesData/InstanceStatus/TagBuckets
  const filteredVariants = useMemo<PokemonVariant[]>(() => {
    if (instanceStatus) {
      return getFilteredPokemonsByOwnership(
        variants,
        instancesData,
        instanceStatus,
        tagBuckets
      );
    }
    return variants;
  }, [variants, instancesData, instanceStatus, tagBuckets]);

  // further filtering (evolution lines, etc.)
  const displayedPokemons = useQueryPokemons(
    filteredVariants,
    variants,
    searchTerm,
    showEvolutionaryLine
  );

  // final sort
  const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode);

  return { filteredVariants, sortedPokemons };
}

export default usePokemonProcessing;

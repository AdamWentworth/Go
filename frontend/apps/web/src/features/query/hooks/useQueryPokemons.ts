// useQueryPokemons.ts
import { useMemo } from 'react';
import { getEvolutionaryFamily } from '@/features/query/utils/getEvolutionaryFamily';
import { matchesSearchTerm } from '@/features/query/matchers/matchesSearchTerm';
import type { PokemonVariant } from '@/types/pokemonVariants';

const useQueryPokemons = (
  filteredVariants: PokemonVariant[],
  variants: PokemonVariant[],
  searchTerm: string,
  showEvolutionaryLine: boolean
): PokemonVariant[] => {

  const displayedPokemons = useMemo(() => {
    // Split search term into individual terms
    const terms = searchTerm.split(',').map(t => t.trim().toLowerCase());
    const plusTerms = terms.filter(t => t.startsWith('+')).map(t => t.slice(1));
    const nonPlusTerms = terms.filter(t => !t.startsWith('+'));
    const nonPlusSearchTerm = nonPlusTerms.join(',');

    // Get family IDs for plus terms
    const plusFamilyIds = new Set<number>();
    plusTerms.forEach(term => {
      const family = getEvolutionaryFamily(term, variants);
      family.forEach(id => plusFamilyIds.add(id));
    });

    // Original family logic for when showEvolutionaryLine is true
    const originalFamilyIds = showEvolutionaryLine
      ? new Set(getEvolutionaryFamily(searchTerm, variants))
      : new Set<number>();

    return filteredVariants.filter(pokemon => {
      const isInOriginalFamily = originalFamilyIds.has(pokemon.pokemon_id);
      const isInPlusFamily = plusFamilyIds.has(pokemon.pokemon_id);
      const matchesNonPlus = nonPlusTerms.length > 0
        ? matchesSearchTerm(pokemon, nonPlusSearchTerm)
        : false;

      if (showEvolutionaryLine) {
        return isInOriginalFamily;
      }

      if (plusTerms.length > 0) {
        // Include plus family or matches non-plus terms if they exist
        return nonPlusTerms.length > 0
          ? isInPlusFamily || matchesNonPlus
          : isInPlusFamily;
      }

      // Default case: match the entire search term
      return matchesSearchTerm(pokemon, searchTerm);
    });
  }, [filteredVariants, variants, searchTerm, showEvolutionaryLine]);

  return displayedPokemons;
};

export default useQueryPokemons;
// matchesSearchTerm.ts

import type { PokemonVariant } from '@/types/pokemonVariants';
import { checkTermMatches } from './checkTermMatches';

export function matchesSearchTerm(
  pokemon: PokemonVariant,
  searchTerm: string,
): boolean {
  // Remove pokemonTypes parameter
  const unionTerms = searchTerm.split(',').map(t => t.trim().toLowerCase());

  for (const uTerm of unionTerms) {
    const intersectionTerms = uTerm.split('&').map(term =>
      term.startsWith('+') ? term.slice(1).toLowerCase() : term.toLowerCase()
    );

    const allMatch = intersectionTerms.every(term =>
      checkTermMatches(pokemon, term)
    );

    if (allMatch) return true;
  }

  return false;
}
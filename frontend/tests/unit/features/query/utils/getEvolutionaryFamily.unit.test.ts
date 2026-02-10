import { describe, expect, it } from 'vitest';

import { getEvolutionaryFamily } from '@/features/query/utils/getEvolutionaryFamily';

import type { PokemonVariant } from '@/types/pokemonVariants';

function makeVariant(overrides: Partial<PokemonVariant>): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    species_name: 'Bulbasaur',
    variantType: 'default',
    currentImage: undefined,
    costumes: [],
    evolves_to: [],
    evolves_from: [],
    ...overrides,
  } as PokemonVariant;
}

const variants: PokemonVariant[] = [
  makeVariant({ pokemon_id: 1, species_name: 'Bulbasaur', evolves_to: [2] }),
  makeVariant({ pokemon_id: 2, species_name: 'Ivysaur', evolves_to: [3], evolves_from: [1] }),
  makeVariant({ pokemon_id: 3, species_name: 'Venusaur', evolves_from: [2] }),
  makeVariant({ pokemon_id: 4, species_name: 'Charmander', evolves_to: [5] }),
  makeVariant({ pokemon_id: 5, species_name: 'Charmeleon', evolves_from: [4] }),
  // Extra variant row for same species/id should not break traversal.
  makeVariant({ variant_id: '0001-shiny', pokemon_id: 1, species_name: 'Bulbasaur', variantType: 'shiny', evolves_to: [2] }),
];

describe('getEvolutionaryFamily', () => {
  it('returns full evolutionary chain for a matching species term', () => {
    const family = getEvolutionaryFamily('bulb', variants);

    expect([...family].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('supports multi-term syntax (+, &, ,) by extracting term tokens', () => {
    const family = getEvolutionaryFamily('bulb,+char', variants);

    expect([...family].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns empty set for empty search term', () => {
    expect(getEvolutionaryFamily('', variants)).toEqual(new Set<number>());
    expect(getEvolutionaryFamily('   ', variants)).toEqual(new Set<number>());
  });
});

import { describe, expect, it } from 'vitest';

import {
  isPokedexPokemonReleased,
  mergePokedexSpecies,
} from '@/pages/Pokedex/pokedexSpecies';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonPokedexSpecies } from '@shared-contracts/pokemon';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    form: null,
    generation: 1,
    available: 1,
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    image_url: '/images/default/pokemon_1.png',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max: [],
    evolves_from: [],
    evolves_to: [],
    ...overrides,
  } as PokemonVariant;
}

const unreleasedSpecies: PokemonPokedexSpecies = {
  pokemon_id: 151,
  name: 'Unreleased Kanto Species',
  pokedex_number: 151,
  image_url: null,
  gender_rate: 'Genderless',
  form: null,
  generation: 1,
  available: false,
};

describe('Pokedex species catalog merge', () => {
  it('adds unavailable base cards without removing released variant categories', () => {
    const base = makeVariant();
    const shiny = makeVariant({
      variant_id: '0001-shiny',
      variantType: 'shiny',
      currentImage: '/images/shiny/shiny_pokemon_1.png',
    });

    const merged = mergePokedexSpecies(
      [base, shiny],
      [
        {
          pokemon_id: 1,
          name: 'Bulbasaur',
          pokedex_number: 1,
          image_url: '/images/default/pokemon_1.png',
          gender_rate: 'M/F',
          form: null,
          generation: 1,
          available: true,
        },
        unreleasedSpecies,
      ],
    );

    expect(merged).toEqual(expect.arrayContaining([base, shiny]));
    expect(merged).toContainEqual(
      expect.objectContaining({
        pokemon_id: 151,
        pokedex_number: 151,
        species_name: 'Unreleased Kanto Species',
        variantType: 'default',
        available: 0,
      }),
    );
  });

  it('treats only explicit zero availability as unreleased', () => {
    expect(isPokedexPokemonReleased(makeVariant({ available: 1 }))).toBe(true);
    expect(isPokedexPokemonReleased(makeVariant({ available: 0 }))).toBe(false);
  });
});

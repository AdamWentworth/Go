import { describe, expect, it } from 'vitest';

import { buildPvPIvPokemonOptions } from '@/pages/Pvp/utils/pvpIvPokemon';
import type { PokemonVariant } from '@/types/pokemonVariants';

const variant = (
  variantType: PokemonVariant['variantType'],
  overrides: Partial<PokemonVariant> = {},
): PokemonVariant => ({
  variant_id: `0001-${variantType}`,
  variantType,
  pokemon_id: 1,
  pokedex_number: 1,
  name: 'Bulbasaur',
  species_name: 'Bulbasaur',
  currentImage: '/images/bulbasaur.png',
  image_url: '/images/bulbasaur.png',
  attack: 118,
  defense: 111,
  stamina: 128,
  type1_name: 'Grass',
  type2_name: 'Poison',
  crownForms: [],
  ...overrides,
} as PokemonVariant);

describe('PvP IV Rank species options', () => {
  it('keeps battle-stat forms while removing cosmetic and ineligible transformations', () => {
    const options = buildPvPIvPokemonOptions([
      variant('default'),
      variant('shiny'),
      variant('shadow'),
      variant('dynamax'),
      variant('mega'),
      variant('fusion_7', {
        variant_id: '0646-fusion_7',
        pokemon_id: 646,
        pokedex_number: 646,
        name: 'Black Kyurem',
        species_name: 'Black Kyurem',
        attack: 310,
        defense: 183,
        stamina: 245,
      }),
    ]);

    expect(options.map((option) => option.name)).toEqual([
      'Bulbasaur',
      'Black Kyurem',
    ]);
  });

  it('expands crowned forms with their own stats and image', () => {
    const options = buildPvPIvPokemonOptions([
      variant('default', {
        variant_id: '0888-default',
        pokemon_id: 888,
        pokedex_number: 888,
        name: 'Zacian',
        species_name: 'Zacian',
        crownForms: [{
          id: 1,
          base_pokemon_id: 888,
          crown_pokemon_id: 1,
          display_form: 'Crowned Sword',
          name: 'Zacian Crowned Sword',
          image_url: '/images/zacian-crowned.png',
          attack: 332,
          defense: 240,
          stamina: 192,
          type_1_id: 9,
          type_2_id: 17,
          type1_name: 'Fairy',
          type2_name: 'Steel',
        }],
      }),
    ]);

    expect(options).toHaveLength(2);
    expect(options[1]).toMatchObject({
      name: 'Zacian Crowned Sword',
      imageUrl: '/images/zacian-crowned.png',
      attack: 332,
      defense: 240,
      stamina: 192,
      types: ['fairy', 'steel'],
    });
  });
});


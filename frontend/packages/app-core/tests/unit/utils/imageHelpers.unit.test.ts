import { describe, expect, it } from 'vitest';

import { determineImageUrl } from '@/utils/imageHelpers';

import type { Costume, FemaleVariantData } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

function makeFemaleData(overrides: Partial<FemaleVariantData> = {}): FemaleVariantData {
  return {
    pokemon_id: 3,
    image_url: '/images/female/female_pokemon_3.png',
    shadow_image_url: '/images/female/shadow_female_pokemon_3.png',
    shiny_image_url: '/images/female/shiny_female_pokemon_3.png',
    shiny_shadow_image_url: '/images/female/shiny_shadow_female_pokemon_3.png',
    ...overrides,
  };
}

function makePokemon(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0003-default',
    pokemon_id: 3,
    pokedex_number: 3,
    name: 'Venusaur',
    species_name: 'Venusaur',
    form: null,
    generation: 1,
    variantType: 'default',
    currentImage: '/images/default/pokemon_3.png',
    image_url: '/images/default/pokemon_3.png',
    image_url_shiny: '/images/shiny/shiny_pokemon_3.png',
    image_url_shadow: '/images/shadow/shadow_pokemon_3.png',
    image_url_shiny_shadow: '/images/shiny_shadow/shiny_shadow_pokemon_3.png',
    gender_rate: 'M/F',
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/types/grass.png',
    type_2_icon: '/types/poison.png',
    attack: 198,
    defense: 189,
    stamina: 190,
    cp40: 2720,
    cp50: 3075,
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

describe('determineImageUrl', () => {
  it('uses the unique female image when a species has female art', () => {
    const venusaur = makePokemon({
      female_data: makeFemaleData(),
    });

    expect(determineImageUrl(true, venusaur)).toBe('/images/female/female_pokemon_3.png');
  });

  it('uses the unique female shiny image when available', () => {
    const venusaur = makePokemon({
      variantType: 'shiny',
      currentImage: '/images/shiny/shiny_pokemon_3.png',
      female_data: makeFemaleData(),
    });

    expect(determineImageUrl(true, venusaur)).toBe('/images/female/shiny_female_pokemon_3.png');
  });

  it('falls back to the matching non-female variant image when female variant art is missing', () => {
    const venusaur = makePokemon({
      variantType: 'shiny',
      currentImage: '/images/shiny/shiny_pokemon_3.png',
      female_data: makeFemaleData({ shiny_image_url: '' }),
    });

    expect(determineImageUrl(true, venusaur)).toBe('/images/shiny/shiny_pokemon_3.png');
  });

  it('falls back to the matching costume image when female costume art is missing', () => {
    const costume = {
      costume_id: 7,
      date_available: '2024-01-01',
      date_shiny_available: null,
      image_url: '/images/costumes/pokemon_3_hat.png',
      image_url_female: undefined,
      image_url_shiny: '/images/costumes/shiny_pokemon_3_hat.png',
      image_url_shiny_female: null,
      name: 'Hat',
      shadow_costume: null,
      shiny_available: true,
    } satisfies Costume;

    const venusaur = makePokemon({
      variantType: 'costume_7',
      currentImage: '/images/costumes/pokemon_3_hat.png',
      costumes: [costume],
      female_data: makeFemaleData(),
    });

    expect(determineImageUrl(true, venusaur)).toBe('/images/costumes/pokemon_3_hat.png');
  });
});

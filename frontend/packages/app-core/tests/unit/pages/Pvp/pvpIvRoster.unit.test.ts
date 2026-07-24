import { describe, expect, it } from 'vitest';

import { buildPvPIvPokemonOptions } from '@/pages/Pvp/utils/pvpIvPokemon';
import { buildOwnedPvPIvRoster } from '@/pages/Pvp/utils/pvpIvRoster';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

const bulbasaur = {
  variant_id: '0001-default',
  variantType: 'default',
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
} as unknown as PokemonVariant;

const caught = (
  id: string,
  overrides: Partial<PokemonInstance> = {},
): PokemonInstance => ({
  instance_id: id,
  variant_id: '0001-default',
  pokemon_id: 1,
  nickname: null,
  is_caught: true,
  disabled: false,
  cp: 1_200,
  level: 30,
  attack_iv: 0,
  defense_iv: 15,
  stamina_iv: 15,
  favorite: false,
  ...overrides,
} as PokemonInstance);

describe('PvP IV Rank caught roster', () => {
  it('keeps caught copies with complete IVs without requiring moves or level', () => {
    const options = buildPvPIvPokemonOptions([bulbasaur]);
    const roster = buildOwnedPvPIvRoster(options, [bulbasaur], {
      complete: caught('complete', {
        nickname: 'Sprout',
        cp: null,
        level: null,
        favorite: true,
      }),
      incomplete: caught('incomplete', {
        attack_iv: null,
      }),
      wanted: caught('wanted', {
        is_caught: false,
      }),
    });

    expect(roster).toMatchObject({
      caughtCount: 2,
      completeCount: 1,
      incompleteCount: 1,
      unmatchedCount: 0,
    });
    expect(roster.entries[0]).toMatchObject({
      instanceId: 'complete',
      nickname: 'Sprout',
      cp: null,
      level: null,
      favorite: true,
      ivs: {
        attack: 0,
        defense: 15,
        stamina: 15,
      },
    });
  });

  it('maps shiny copies to the same species ranking while preserving their image', () => {
    const shiny = {
      ...bulbasaur,
      variant_id: '0001-shiny',
      variantType: 'shiny',
      currentImage: '/images/bulbasaur-shiny.png',
    } as unknown as PokemonVariant;
    const options = buildPvPIvPokemonOptions([bulbasaur, shiny]);
    const roster = buildOwnedPvPIvRoster(options, [bulbasaur, shiny], {
      shiny: caught('shiny', {
        variant_id: '0001-shiny',
        shiny: true,
      }),
    });

    expect(roster.entries[0]).toMatchObject({
      pokemon: {
        id: '0001-default',
        name: 'Bulbasaur',
      },
      imageUrl: '/images/bulbasaur-shiny.png',
    });
  });
});

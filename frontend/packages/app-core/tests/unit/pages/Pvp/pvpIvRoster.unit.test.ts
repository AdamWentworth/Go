import { describe, expect, it } from 'vitest';

import { buildPvPIvPokemonOptions } from '@/pages/Pvp/utils/pvpIvPokemon';
import {
  buildOwnedPvPIvRoster,
  rankOwnedPvPIvEntries,
} from '@/pages/Pvp/utils/pvpIvRoster';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

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

const ranking = (
  rank: number,
  pokemonId: number,
  name: string,
  score: number,
): PokemonPvPRankingEntry => ({
  rank,
  sourceRank: rank,
  speciesId: name.toLowerCase(),
  name,
  pokemonId,
  variantKind: 'pokemon',
  imageUrl: `/images/${name.toLowerCase()}.png`,
  types: ['grass'],
  moveset: [],
  score,
  rating: 700,
  categoryScores: [score, score, score, score, score, score],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 50,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
});

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

  it('hides copies above the cap and recommends by league relevance plus IV rank', () => {
    const sprigatito = {
      ...bulbasaur,
      variant_id: '0906-default',
      pokemon_id: 906,
      pokedex_number: 906,
      name: 'Sprigatito',
      species_name: 'Sprigatito',
      currentImage: '/images/sprigatito.png',
      image_url: '/images/sprigatito.png',
      attack: 116,
      defense: 99,
      stamina: 120,
      type2_name: null,
    } as unknown as PokemonVariant;
    const variants = [bulbasaur, sprigatito];
    const options = buildPvPIvPokemonOptions(variants);
    const roster = buildOwnedPvPIvRoster(
      options,
      variants,
      {
        overCap: caught('over-cap', {
          nickname: 'Too Large',
          cp: 1_501,
          attack_iv: 15,
          defense_iv: 15,
          stamina_iv: 15,
        }),
        perfectBulbasaur: caught('perfect-bulbasaur', {
          nickname: 'Perfect Bulbasaur',
          cp: 1_200,
          attack_iv: 15,
          defense_iv: 15,
          stamina_iv: 15,
        }),
        metaSprigatito: caught('meta-sprigatito', {
          variant_id: '0906-default',
          pokemon_id: 906,
          nickname: 'Meta Sprigatito',
          cp: 500,
          attack_iv: 7,
          defense_iv: 7,
          stamina_iv: 7,
        }),
      },
      [ranking(4, 906, 'Sprigatito', 94)],
    );

    const recommendations = rankOwnedPvPIvEntries(
      roster.entries,
      'great',
      50,
      1_500,
    );

    expect(recommendations.map(({ entry }) => entry.nickname)).toEqual([
      'Meta Sprigatito',
      'Perfect Bulbasaur',
    ]);
    expect(recommendations[0]).toMatchObject({
      entry: {
        metaRank: 4,
        metaScore: 94,
      },
    });
    expect(recommendations[0].ivRank).toBeGreaterThan(1);
    expect(recommendations[1]).toMatchObject({
      entry: {
        metaRank: null,
        metaScore: null,
      },
      ivRank: 1,
    });
  });
});

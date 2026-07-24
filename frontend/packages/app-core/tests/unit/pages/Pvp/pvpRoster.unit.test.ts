import { describe, expect, it } from 'vitest';

import { buildOwnedPvPRoster } from '@/pages/Pvp/utils/pvpRoster';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

const moves = [
  {
    move_id: 1,
    name: 'Vine Whip',
    type_id: 12,
    raid_power: 7,
    pvp_power: 5,
    raid_energy: 7,
    pvp_energy: 8,
    raid_cooldown: 600,
    pvp_turns: 2,
    is_fast: 1,
    type_name: 'grass',
    legacy: false,
    type: 'grass',
  },
  {
    move_id: 2,
    name: 'Power Whip',
    type_id: 12,
    raid_power: 90,
    pvp_power: 90,
    raid_energy: -50,
    pvp_energy: -50,
    raid_cooldown: 2500,
    pvp_turns: 0,
    is_fast: 0,
    type_name: 'grass',
    legacy: false,
    type: 'grass',
  },
  {
    move_id: 3,
    name: 'Sludge Bomb',
    type_id: 4,
    raid_power: 80,
    pvp_power: 80,
    raid_energy: -50,
    pvp_energy: -50,
    raid_cooldown: 2300,
    pvp_turns: 0,
    is_fast: 0,
    type_name: 'poison',
    legacy: false,
    type: 'poison',
  },
];

const variant = {
  variant_id: '0001-default',
  pokemon_id: 1,
  pokedex_number: 1,
  name: 'Bulbasaur',
  species_name: 'Bulbasaur',
  variantType: 'default',
  currentImage: '/images/bulbasaur.png',
  moves,
  fusion: [],
  crownForms: [],
  megaEvolutions: [],
} as unknown as PokemonVariant;

const ranking = {
  rank: 1,
  sourceRank: 1,
  speciesId: 'bulbasaur',
  name: 'Bulbasaur',
  pokemonId: 1,
  variantKind: 'pokemon',
  imageUrl: '/images/ranked-bulbasaur.png',
  types: ['grass', 'poison'],
  moveset: [],
  score: 90,
  rating: 700,
  categoryScores: [90, 90, 90, 90, 90, 90],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 50,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
} as PokemonPvPRankingEntry;

const instance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance => ({
  variant_id: variant.variant_id,
  pokemon_id: 1,
  nickname: 'Leaf',
  cp: 1_480,
  level: 32.5,
  attack_iv: 4,
  defense_iv: 14,
  stamina_iv: 15,
  fast_move_id: 1,
  charged_move1_id: 2,
  charged_move2_id: 3,
  is_caught: true,
  disabled: false,
  shadow: false,
  is_fused: false,
  crown: false,
  mega: false,
  is_mega: false,
  shiny: false,
  ...overrides,
} as PokemonInstance);

describe('buildOwnedPvPRoster', () => {
  it('uses the caught copy actual build and recorded moves', () => {
    const roster = buildOwnedPvPRoster(
      [ranking],
      [variant],
      { caught: instance() },
      1_500,
    );

    expect(roster.eligibleCount).toBe(1);
    expect(roster.entries[0]).toMatchObject({
      nickname: 'Leaf',
      cp: 1_480,
      entry: {
        recommendedLevel: 32.5,
        attackIv: 4,
        defenseIv: 14,
        staminaIv: 15,
        imageUrl: '/images/bulbasaur.png',
      },
    });
    expect(roster.entries[0].entry.moveset.map((move) => move.name)).toEqual([
      'Vine Whip',
      'Power Whip',
      'Sludge Bomb',
    ]);
  });

  it('separates over-cap, incomplete, and unmatched caught copies', () => {
    const roster = buildOwnedPvPRoster(
      [ranking],
      [variant],
      {
        over: instance({ cp: 1_501 }),
        incomplete: instance({ charged_move2_id: null }),
        unmatched: instance({ variant_id: '9999-default' }),
      },
      1_500,
    );

    expect(roster).toMatchObject({
      caughtCount: 3,
      eligibleCount: 0,
      overCapCount: 1,
      incompleteCount: 1,
      unmatchedCount: 1,
    });
  });
});

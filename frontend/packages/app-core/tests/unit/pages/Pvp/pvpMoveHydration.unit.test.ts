import { describe, expect, it } from 'vitest';

import {
  buildPvPMoveMechanicsLookupFromChunk,
  hydratePvPRankingEntry,
} from '@/pages/Pvp/utils/pvpMoveHydration';
import type {
  Move,
  PokemonMovesChunk,
  PokemonPvPRankingEntry,
} from '@shared-contracts/pokemon';

const move = (
  moveId: number,
  name: string,
  isFast: boolean,
): Move => ({
  move_id: moveId,
  name,
  type_id: 1,
  raid_power: 1,
  pvp_power: isFast ? 8 : 60,
  raid_energy: 1,
  pvp_energy: isFast ? 10 : -35,
  raid_cooldown: 1,
  pvp_turns: isFast ? 2 : 1,
  pvp_attacker_attack_stage_change: 0,
  pvp_attacker_defense_stage_change: 0,
  pvp_target_attack_stage_change: 0,
  pvp_target_defense_stage_change: 0,
  pvp_buff_activation_chance: 0,
  is_fast: isFast ? 1 : 0,
  type_name: 'Normal',
  legacy: false,
  type: 'normal',
});

const rankingEntry: PokemonPvPRankingEntry = {
  rank: 1,
  sourceRank: 1,
  speciesId: 'fixture',
  name: 'Fixture',
  pokemonId: 1,
  variantKind: 'pokemon',
  imageUrl: '/fixture.png',
  types: ['normal'],
  moveset: [
    {
      id: 'quick-attack',
      name: 'Quick Attack',
      type: 'normal',
      kind: 'fast',
    },
    {
      id: 'body-slam',
      name: 'Body Slam',
      type: 'normal',
      kind: 'charged',
    },
  ],
  score: 100,
  rating: 700,
  categoryScores: [100, 100, 100, 100, 100, 100],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 50,
  attackIv: 15,
  defenseIv: 15,
  staminaIv: 15,
  battleAttack: 100,
  battleDefense: 100,
  battleHp: 100,
};

describe('PvP move hydration', () => {
  it('hydrates lightweight ranking moves with published battle mechanics', () => {
    const chunk: PokemonMovesChunk = [{
      pokemon_id: 1,
      moves: [
        move(1, 'Quick Attack', true),
        move(2, 'Body Slam', false),
      ],
      fusion: [],
      crownForms: [],
    }];
    const lookup = buildPvPMoveMechanicsLookupFromChunk(chunk);
    const hydrated = hydratePvPRankingEntry(rankingEntry, lookup);

    expect(hydrated.moveset[0]).toMatchObject({
      power: 8,
      energyGain: 10,
      turns: 2,
      buff: { chance: 0 },
    });
    expect(hydrated.moveset[1]).toMatchObject({
      power: 60,
      energyCost: 35,
      buff: { chance: 0 },
    });
  });

  it('indexes fusion and crowned-form moves from the compact moves chunk', () => {
    const chunk: PokemonMovesChunk = [{
      pokemon_id: 1,
      moves: [],
      fusion: [{
        fusion_id: 10,
        moves: [move(3, 'Fusion Move', false)],
      }],
      crownForms: [{
        id: 20,
        moves: [move(4, 'Crown Move', true)],
      }],
    }];
    const lookup = buildPvPMoveMechanicsLookupFromChunk(chunk);

    expect(lookup.get('fusionmove')?.energyCost).toBe(35);
    expect(lookup.get('crownmove')?.energyGain).toBe(10);
  });

  it('preserves a ranking move when no published mechanic matches it', () => {
    const hydrated = hydratePvPRankingEntry(rankingEntry, new Map());

    expect(hydrated.moveset).toEqual(rankingEntry.moveset);
  });
});

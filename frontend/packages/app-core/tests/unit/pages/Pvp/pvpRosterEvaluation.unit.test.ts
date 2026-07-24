import { describe, expect, it } from 'vitest';

import {
  applyPvPRosterEvaluation,
  buildPvPRosterEvaluationPlan,
} from '@/pages/Pvp/utils/pvpRosterEvaluation';
import type { OwnedPvPRankingEntry } from '@/pages/Pvp/utils/pvpRoster';
import type {
  PokemonPvPRankingEntry,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

const buff = {
  attackerAttack: 0,
  attackerDefense: 0,
  targetAttack: 0,
  targetDefense: 0,
  chance: 0,
};

const ranking = (
  speciesId: string,
  sourceRank: number,
  attack: number,
): PokemonPvPRankingEntry => ({
  rank: sourceRank,
  sourceRank,
  speciesId,
  name: speciesId,
  pokemonId: sourceRank,
  variantKind: 'pokemon',
  imageUrl: '/pokemon.png',
  types: ['normal'],
  moveset: [
    {
      id: 'fast',
      name: 'Fast',
      type: 'normal',
      kind: 'fast',
      power: 5,
      energyGain: 8,
      energyCost: 0,
      turns: 2,
      buff,
    },
    {
      id: 'charged',
      name: 'Charged',
      type: 'normal',
      kind: 'charged',
      power: 80,
      energyGain: 0,
      energyCost: 50,
      turns: 1,
      buff,
    },
  ],
  score: 95 - sourceRank,
  rating: 700,
  categoryScores: [90, 90, 90, 90, 90, 90],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 30,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
  battleAttack: attack,
  battleDefense: 120,
  battleHp: 130,
});

const owned = (
  instanceId: string,
  attack: number,
): OwnedPvPRankingEntry => ({
  entry: ranking('bulbasaur', 3, attack),
  instanceId,
  nickname: null,
  cp: 1_400,
});

describe('PvP roster evaluation planning', () => {
  it('sends exact per-copy stats and a bounded source-ranked meta field', () => {
    const builds = [owned('weak-copy', 80), owned('strong-copy', 110)];
    const meta = Array.from(
      { length: 18 },
      (_, index) => ranking(`meta-${index + 1}`, 18 - index, 100 + index),
    );

    const plan = buildPvPRosterEvaluationPlan(
      builds,
      meta,
      'great',
    );

    expect(plan).not.toBeNull();
    expect(plan!.request.candidates).toHaveLength(2);
    expect(plan!.request.candidates.map((fighter) => ({
      id: fighter.id,
      attack: fighter.attack,
    }))).toEqual([
      { id: 'weak-copy', attack: 80 },
      { id: 'strong-copy', attack: 110 },
    ]);
    expect(plan!.request.opponents).toHaveLength(12);
    expect(plan!.request.opponents[0].fighter.id).toBe('meta:meta-18');
  });

  it('applies simulated scores to the matching copy without mutating others', () => {
    const builds = [owned('weak-copy', 80), owned('strong-copy', 110)];
    const response: PokemonPvPRosterEvaluationResponse = {
      mechanics: 'pvpoke-legacy',
      fieldSize: 12,
      results: [{
        fighterId: 'strong-copy',
        score: 87.5,
        categoryScores: [80, 81, 82, 83, 84, 90],
      }],
    };

    const evaluated = applyPvPRosterEvaluation(builds, response);

    expect(evaluated[0].entry.score).toBe(builds[0].entry.score);
    expect(evaluated[1].entry.score).toBe(87.5);
    expect(evaluated[1].entry.categoryScores).toEqual(
      [80, 81, 82, 83, 84, 90],
    );
    expect(builds[1].entry.score).not.toBe(87.5);
  });
});

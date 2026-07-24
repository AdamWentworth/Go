import { describe, expect, it, vi } from 'vitest';

import {
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
} from '@/pages/Pvp/utils/pvpLocalRosterEvaluation';
import {
  evaluatePvPRosterAsync,
  simulatePvPBattleAsync,
} from '@/pages/Pvp/utils/pvpWorkers';
import type {
  PokemonPvPBattleFighter,
  PokemonPvPRankingMove,
} from '@shared-contracts/pokemon';

const buff = {
  attackerAttack: 0,
  attackerDefense: 0,
  targetAttack: 0,
  targetDefense: 0,
  chance: 0,
};

const fastMove: PokemonPvPRankingMove = {
  id: 'DRAGON_TAIL',
  name: 'Dragon Tail',
  type: 'dragon',
  kind: 'fast',
  power: 13,
  energyGain: 9,
  energyCost: 0,
  turns: 3,
  buff,
};

const chargedMove: PokemonPvPRankingMove = {
  id: 'SKY_ATTACK',
  name: 'Sky Attack',
  type: 'flying',
  kind: 'charged',
  power: 75,
  energyGain: 0,
  energyCost: 50,
  turns: 1,
  buff,
};

const fighter = (
  id: string,
  attack: number,
  defense: number,
  hp: number,
): PokemonPvPBattleFighter => ({
  id,
  name: id,
  types: ['dragon', 'flying'],
  attack,
  defense,
  hp,
  shadow: false,
  fastMove,
  chargedMoves: [chargedMove],
});

const opponents = [
  { fighter: fighter('meta-one', 180, 180, 180), weight: 1 },
  { fighter: fighter('meta-two', 200, 160, 170), weight: 0.9 },
];

const request = (
  exact: PokemonPvPBattleFighter,
  reference: PokemonPvPBattleFighter,
  sourceScore = 94.8,
) => ({
  kind: 'evaluate' as const,
  candidates: [{
    fighter: exact,
    referenceFighter: reference,
    sourceScore,
    sourceCategoryScores: [95, 94, 96, 93, 95, 90],
  }],
  opponents,
});

describe('local personal PvP evaluation', () => {
  it('preserves the published score when the recorded build matches its reference', () => {
    const reference = fighter('reference', 210, 190, 190);
    const result = evaluatePvPRosterLocally(
      request({ ...reference, id: 'caught' }, reference),
    );

    expect(result.fieldSize).toBe(2);
    expect(result.results[0].score).toBeCloseTo(94.8, 1);
    expect(result.results[0].fighterId).toBe('caught');
  });

  it('lowers an underleveled copy instead of reusing its species score', () => {
    const reference = fighter('reference', 220, 210, 205);
    const exact = fighter('level-40-copy', 206, 197, 193);
    const result = evaluatePvPRosterLocally(request(exact, reference));

    expect(result.results[0].score).toBeLessThan(94.8);
    expect(result.results[0].categoryScores.slice(0, 5))
      .toEqual(expect.arrayContaining([
        expect.any(Number),
      ]));
  });

  it('adjusts unlike species independently from their own reference builds', () => {
    const kyuremReference = fighter('kyurem-reference', 250, 190, 210);
    const lugiaReference = fighter('lugia-reference', 190, 250, 235);
    const response = evaluatePvPRosterLocally({
      kind: 'evaluate',
      candidates: [
        {
          fighter: fighter('kyurem-level-40', 235, 179, 197),
          referenceFighter: kyuremReference,
          sourceScore: 94.8,
          sourceCategoryScores: [95, 95, 95, 95, 95, 90],
        },
        {
          fighter: { ...lugiaReference, id: 'lugia-level-50' },
          referenceFighter: lugiaReference,
          sourceScore: 91,
          sourceCategoryScores: [91, 91, 91, 91, 91, 90],
        },
      ],
      opponents,
    });
    const scores = new Map(
      response.results.map((result) => [result.fighterId, result.score]),
    );

    expect(scores.get('lugia-level-50')).toBe(91);
    expect(scores.get('kyurem-level-40')).toBeLessThan(94.8);
    expect(scores.get('kyurem-level-40')).not.toBe(94.8);
  });

  it('falls back to the same local evaluator when Worker is unavailable', async () => {
    const reference = fighter('reference', 210, 190, 190);
    const result = await evaluatePvPRosterAsync(
      request({ ...reference, id: 'caught' }, reference),
    );

    expect(result.results[0].fighterId).toBe('caught');
  });
});

describe('local PvP Battle Lab simulation', () => {
  const battleRequest = {
    mechanics: 'pvpoke-legacy' as const,
    fighters: [
      fighter('strong', 230, 220, 210),
      fighter('weak', 150, 150, 150),
    ] as [PokemonPvPBattleFighter, PokemonPvPBattleFighter],
    shields: [1, 1] as [number, number],
    startingEnergy: [100, 0] as [number, number],
    recordTimeline: true,
  };

  it('returns a detailed deterministic result without an API request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const result = await simulatePvPBattleAsync(battleRequest);

    expect(result.mechanics).toBe('pvpoke-legacy');
    expect(result.winner).toBe(0);
    expect(result.fighters[0].maxHp).toBe(210);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.timeline.some((event) => event.kind === 'charged')).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('honors shields, starting energy, and timeline controls', () => {
    const result = simulatePvPBattleLocally({
      ...battleRequest,
      shields: [0, 2],
      startingEnergy: [100, 0],
      recordTimeline: false,
    });

    expect(result.fighters[0].startShields).toBe(0);
    expect(result.fighters[1].startShields).toBe(2);
    expect(result.timeline).toEqual([]);
  });

  it('rejects unsupported mechanics before starting work', () => {
    expect(() => simulatePvPBattleLocally({
      ...battleRequest,
      mechanics: 'current-2026',
    } as unknown as typeof battleRequest)).toThrow(
      'pinned PvPoke mechanics',
    );
  });
});

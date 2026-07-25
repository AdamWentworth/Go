import { describe, expect, it, vi } from 'vitest';

import {
  evaluatePvPTeamLocally,
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
  simulatePvPTeamBattleLocally,
} from '@/pages/Pvp/utils/pvpLocalRosterEvaluation';
import {
  evaluatePvPTeamAsync,
  evaluatePvPRosterAsync,
  simulatePvPBattleAsync,
  simulatePvPTeamBattleAsync,
} from '@/pages/Pvp/utils/pvpWorkers';
import type {
  PvPTeamBattleRequest,
} from '@/pages/Pvp/utils/pvpWorkerProtocol';
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

const riskyCoverageMove: PokemonPvPRankingMove = {
  id: 'RISKY_COVERAGE',
  name: 'Risky Coverage',
  type: 'ice',
  kind: 'charged',
  power: 65,
  energyGain: 0,
  energyCost: 35,
  turns: 1,
  buff: {
    ...buff,
    attackerAttack: -2,
    chance: 1,
  },
};

const mudShot: PokemonPvPRankingMove = {
  id: 'MUD_SHOT',
  name: 'Mud Shot',
  type: 'ground',
  kind: 'fast',
  power: 3,
  energyGain: 9,
  energyCost: 0,
  turns: 2,
  buff,
};

const precipiceBlades: PokemonPvPRankingMove = {
  id: 'PRECIPICE_BLADES',
  name: 'Precipice Blades',
  type: 'ground',
  kind: 'charged',
  power: 130,
  energyGain: 0,
  energyCost: 60,
  turns: 1,
  buff,
};

const firePunch: PokemonPvPRankingMove = {
  id: 'FIRE_PUNCH',
  name: 'Fire Punch',
  type: 'fire',
  kind: 'charged',
  power: 55,
  energyGain: 0,
  energyCost: 40,
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

  it('never lowers a build because it has an additional charged move', () => {
    const reference = fighter('reference', 210, 190, 190);
    const singleMove = {
      ...reference,
      id: 'single-move',
    };
    const twoMoves = {
      ...reference,
      id: 'two-moves',
      chargedMoves: [chargedMove, riskyCoverageMove],
    };
    const result = evaluatePvPRosterLocally({
      kind: 'evaluate',
      candidates: [
        {
          fighter: singleMove,
          referenceFighter: reference,
          sourceScore: 90,
          sourceCategoryScores: [90, 90, 90, 90, 90, 90],
        },
        {
          fighter: twoMoves,
          referenceFighter: reference,
          sourceScore: 90,
          sourceCategoryScores: [90, 90, 90, 90, 90, 90],
        },
      ],
      opponents,
    });
    const scores = new Map(
      result.results.map((entry) => [entry.fighterId, entry]),
    );

    expect(scores.get('two-moves')!.score)
      .toBeGreaterThanOrEqual(scores.get('single-move')!.score);
    scores.get('two-moves')!.categoryScores.forEach((score, index) => {
      expect(score).toBeGreaterThanOrEqual(
        scores.get('single-move')!.categoryScores[index],
      );
    });
  });

  it('does not rank a weaker one-move Groudon over a stronger two-move Groudon', () => {
    const groudon = (
      id: string,
      attack: number,
      defense: number,
      hp: number,
      chargedMoves: PokemonPvPRankingMove[],
    ): PokemonPvPBattleFighter => ({
      id,
      name: 'Groudon',
      types: ['ground'],
      attack,
      defense,
      hp,
      shadow: false,
      fastMove: mudShot,
      chargedMoves,
    });
    const reference = groudon(
      'groudon-reference',
      226,
      196,
      184,
      [precipiceBlades, firePunch],
    );
    const result = evaluatePvPRosterLocally({
      kind: 'evaluate',
      candidates: [
        {
          fighter: groudon(
            'lower-cp-single-move',
            215,
            187,
            176,
            [precipiceBlades],
          ),
          referenceFighter: reference,
          sourceScore: 78,
          sourceCategoryScores: [78, 78, 78, 78, 78, 78],
        },
        {
          fighter: {
            ...reference,
            id: 'higher-cp-two-moves',
          },
          referenceFighter: reference,
          sourceScore: 78,
          sourceCategoryScores: [78, 78, 78, 78, 78, 78],
        },
      ],
      opponents,
    });
    const scores = new Map(
      result.results.map((entry) => [entry.fighterId, entry.score]),
    );

    expect(scores.get('higher-cp-two-moves'))
      .toBeGreaterThan(scores.get('lower-cp-single-move')!);
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

describe('local PvP Team Builder evaluation', () => {
  const teamRequest = {
    kind: 'team' as const,
    members: [
      { fighter: fighter('lead', 250, 230, 220), role: 'lead' as const },
      { fighter: fighter('switch', 225, 220, 215), role: 'switch' as const },
      { fighter: fighter('closer', 210, 205, 200), role: 'closer' as const },
    ],
    opponents: [
      { fighter: fighter('field-one', 165, 165, 165), weight: 1 },
      { fighter: fighter('field-two', 175, 170, 170), weight: 0.8 },
    ],
  };

  it('tests stable team roles against one shared local field', () => {
    const result = evaluatePvPTeamLocally(teamRequest);

    expect(result.fieldSize).toBe(2);
    expect(result.coverageCount).toBe(2);
    expect(result.members.map((member) => member.role)).toEqual([
      'lead',
      'switch',
      'closer',
    ]);
    expect(result.opponents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fighterId: 'field-one',
        covered: true,
        bestMemberId: expect.any(String),
      }),
    ]));
  });

  it('uses the worker fallback without making an API request', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const result = await evaluatePvPTeamAsync(teamRequest);

    expect(result.mechanics).toBe('pvpoke-legacy');
    expect(result.members).toHaveLength(3);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects a team test without a meta field', () => {
    expect(() => evaluatePvPTeamLocally({
      ...teamRequest,
      opponents: [],
    })).toThrow('battle-ready meta field');
  });
});

describe('local 3v3 PvP sequencing', () => {
  const teamBattleRequest: PvPTeamBattleRequest = {
    kind: 'team-battle' as const,
    mechanics: 'pvpoke-legacy' as const,
    teams: [
      [
        fighter('player-lead', 260, 240, 230),
        fighter('player-switch', 220, 215, 210),
        fighter('player-closer', 210, 205, 200),
      ],
      [
        fighter('opponent-lead', 145, 145, 145),
        fighter('opponent-switch', 150, 150, 150),
        fighter('opponent-closer', 155, 155, 155),
      ],
    ],
    shields: [2, 2] as [number, number],
    startingEnergy: [0, 0] as [number, number],
  };

  it('carries survivor HP, energy, and shared shields through replacements', () => {
    const result = simulatePvPTeamBattleLocally(teamBattleRequest);

    expect(result.winner).toBe(0);
    expect(result.matchups).toHaveLength(3);
    expect(result.matchups.map((matchup) => matchup.fighterIds[0]))
      .toEqual(['player-lead', 'player-lead', 'player-lead']);
    expect(result.teams[0][0].knockouts).toBe(3);
    expect(result.teams[0][0].hp).toBeLessThan(result.teams[0][0].maxHp);
    expect(result.teams[0][1].hp).toBe(result.teams[0][1].maxHp);
    expect(result.matchups[1].energyAfter[0])
      .not.toBe(teamBattleRequest.startingEnergy[0]);
    expect(result.shields[0]).toBeLessThanOrEqual(2);
    expect(result.shields[1]).toBeLessThanOrEqual(2);
  });

  it('runs the full sequence in the browser-worker fallback without fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const result = await simulatePvPTeamBattleAsync(teamBattleRequest);

    expect(result.mechanics).toBe('pvpoke-legacy');
    expect(result.teams.flat()).toHaveLength(6);
    expect(result.timeMs).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('requires three unique battle-ready Pokémon on each side', () => {
    expect(() => simulatePvPTeamBattleLocally({
      ...teamBattleRequest,
      teams: [
        [
          teamBattleRequest.teams[0][0],
          teamBattleRequest.teams[0][0],
          teamBattleRequest.teams[0][2],
        ],
        [...teamBattleRequest.teams[1]],
      ],
    })).toThrow('cannot repeat');
  });
});

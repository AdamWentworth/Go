import { describe, expect, it, vi } from 'vitest';

import {
  evaluatePvPTeamLocally,
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
  simulatePvPTeamBattleLocally,
  simulatePvPTeamGauntletLocally,
} from '@/pages/Pvp/utils/pvpLocalRosterEvaluation';
import {
  evaluatePvPTeamAsync,
  evaluatePvPRosterAsync,
  simulatePvPBattleAsync,
  simulatePvPTeamBattleAsync,
  simulatePvPTeamGauntletAsync,
} from '@/pages/Pvp/utils/pvpWorkers';
import type {
  PvPTeamBattleRequest,
} from '@/pages/Pvp/utils/pvpWorkerProtocol';
import type {
  PokemonPvPBattleFighter,
  PokemonPvPRankingMove,
} from '@shared-contracts/pokemon';
import {
  PVP_BATTLE_GOLDEN_FIXTURES,
} from '../../../fixtures/pvpBattleGoldenFixtures';

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

const elementalFighter = (
  id: string,
  type: string,
  hp = 200,
): PokemonPvPBattleFighter => ({
  id,
  name: id,
  types: [type],
  attack: 180,
  defense: 180,
  hp,
  shadow: false,
  fastMove: {
    ...fastMove,
    id: `${type.toUpperCase()}_FAST`,
    name: `${type} fast`,
    type,
    power: 8,
    energyGain: 8,
    turns: 2,
  },
  chargedMoves: [{
    ...chargedMove,
    id: `${type.toUpperCase()}_CHARGED`,
    name: `${type} charged`,
    type,
    power: 80,
    energyCost: 40,
  }],
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
  mechanics: 'current-2026' as const,
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
      mechanics: 'current-2026',
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
      mechanics: 'current-2026',
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
      mechanics: 'current-2026',
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

  it('rejects unknown mechanics before starting work', () => {
    expect(() => simulatePvPBattleLocally({
      ...battleRequest,
      mechanics: 'unknown',
    } as unknown as typeof battleRequest)).toThrow(
      'unsupported PvP mechanics',
    );
  });

  it('resolves one-turn Fast Attack damage simultaneously under June 2026 rules', () => {
    const oneTurnFast = {
      ...fastMove,
      id: 'ONE_TURN_FAST',
      power: 100,
      energyGain: 5,
      turns: 1,
    };
    const left = {
      ...fighter('left', 180, 180, 40),
      fastMove: oneTurnFast,
    };
    const right = {
      ...fighter('right', 180, 180, 40),
      fastMove: oneTurnFast,
    };

    const current = simulatePvPBattleLocally({
      mechanics: 'current-2026',
      fighters: [left, right],
      shields: [0, 0],
      startingEnergy: [0, 0],
      recordTimeline: true,
    });
    const legacy = simulatePvPBattleLocally({
      mechanics: 'pvpoke-legacy',
      fighters: [left, right],
      shields: [0, 0],
      startingEnergy: [0, 0],
    });

    expect(current.winner).toBe(-1);
    expect(current.fighters.map(({ hp }) => hp)).toEqual([0, 0]);
    expect(current.timeline.filter(({ kind }) => kind === 'fast'))
      .toEqual([
        expect.objectContaining({ actor: 0, turn: 1 }),
        expect.objectContaining({ actor: 1, turn: 1 }),
      ]);
    expect(legacy.winner).toBe(0);
  });

  it('starts a triggered Charged Attack next turn and preserves it through lethal Fast damage', () => {
    const lethalFast = {
      ...fastMove,
      id: 'LETHAL_FAST',
      power: 100,
      turns: 1,
    };
    const lethalCharged = {
      ...chargedMove,
      id: 'LETHAL_CHARGED',
      power: 200,
      energyCost: 35,
    };
    const left = {
      ...fighter('charged-user', 180, 180, 40),
      chargedMoves: [lethalCharged],
    };
    const right = {
      ...fighter('fast-user', 180, 180, 40),
      fastMove: lethalFast,
    };

    const result = simulatePvPBattleLocally({
      mechanics: 'current-2026',
      fighters: [left, right],
      shields: [0, 0],
      startingEnergy: [35, 0],
      recordTimeline: true,
    });

    expect(result.winner).toBe(-1);
    expect(result.timeline).toEqual([
      expect.objectContaining({
        actor: 1,
        kind: 'fast',
        turn: 1,
      }),
      expect.objectContaining({
        actor: 0,
        kind: 'charged',
        turn: 2,
      }),
    ]);
  });

  it('does not let a CMP loser attack after the winning Charged Attack knocks it out', () => {
    const knockoutMove = {
      ...chargedMove,
      id: 'CMP_KNOCKOUT',
      power: 200,
      energyCost: 35,
    };
    const result = simulatePvPBattleLocally({
      mechanics: 'current-2026',
      fighters: [
        {
          ...fighter('cmp-winner', 220, 180, 40),
          chargedMoves: [knockoutMove],
        },
        {
          ...fighter('cmp-loser', 180, 180, 40),
          chargedMoves: [knockoutMove],
        },
      ],
      shields: [0, 0],
      startingEnergy: [35, 35],
      recordTimeline: true,
    });

    expect(result.winner).toBe(0);
    expect(result.timeline.filter(({ kind }) => kind === 'charged'))
      .toEqual([
        expect.objectContaining({
          actor: 0,
          kind: 'charged',
          turn: 2,
        }),
      ]);
  });

  it.each(PVP_BATTLE_GOLDEN_FIXTURES)(
    'matches the pinned PvPoke outcome for $id',
    (fixture) => {
      const result = simulatePvPBattleLocally({
        mechanics: 'pvpoke-legacy',
        fighters: fixture.fighters,
        shields: fixture.shields,
        startingEnergy: [0, 0],
        recordTimeline: true,
      });

      expect(result.winner).toBe(fixture.expectedWinner);
      expect(
        Math.abs(result.ratings[0] - fixture.expectedRating),
        fixture.sourceUrl,
      ).toBeLessThanOrEqual(fixture.ratingTolerance);
    },
  );

  it('uses meaningful shield bait instead of a trivial resisted attack', () => {
    const fixture = PVP_BATTLE_GOLDEN_FIXTURES.find(
      ({ id }) => id === 'skarmory-vs-whiscash-11',
    );
    expect(fixture).toBeDefined();

    const result = simulatePvPBattleLocally({
      mechanics: 'pvpoke-legacy',
      fighters: fixture!.fighters,
      shields: fixture!.shields,
      startingEnergy: [0, 0],
      recordTimeline: true,
    });
    const firstChargedBySide = ([0, 1] as const).map(
      (side) => result.timeline.find(
        ({ actor, kind }) => actor === side && kind === 'charged',
      )?.moveId,
    );

    expect(firstChargedBySide).toEqual(['SKY_ATTACK', 'BLIZZARD']);
  });

  it('uses a setup attack before exposing a self-debuffing finisher', () => {
    const fixture = PVP_BATTLE_GOLDEN_FIXTURES.find(
      ({ id }) => id === 'lanturn-vs-talonflame-11',
    );
    expect(fixture).toBeDefined();

    const result = simulatePvPBattleLocally({
      mechanics: 'pvpoke-legacy',
      fighters: fixture!.fighters,
      shields: fixture!.shields,
      startingEnergy: [0, 0],
      recordTimeline: true,
    });
    const talonflameMoves = result.timeline.filter(
      ({ actor, kind }) => actor === 1 && kind === 'charged',
    );

    expect(talonflameMoves[0]).toEqual(expect.objectContaining({
      moveId: 'FLAME_CHARGE',
      shielded: false,
    }));
    expect(talonflameMoves[1]).toEqual(expect.objectContaining({
      moveId: 'FLAME_CHARGE',
      shielded: true,
    }));
  });
});

describe('local PvP Team Builder evaluation', () => {
  const teamRequest = {
    kind: 'team' as const,
    mechanics: 'current-2026' as const,
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

    expect(result.mechanics).toBe('current-2026');
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
    switchPolicy: 'fixed' as const,
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

  it('safe-swaps out of a clear lead loss and applies the current switch clock', () => {
    const result = simulatePvPTeamBattleLocally({
      kind: 'team-battle',
      mechanics: 'pvpoke-legacy',
      teams: [
        [
          elementalFighter('fire-lead', 'fire'),
          elementalFighter('electric-switch', 'electric'),
          elementalFighter('grass-closer', 'grass'),
        ],
        [
          elementalFighter('water-lead', 'water'),
          elementalFighter('flying-switch', 'flying'),
          elementalFighter('ice-closer', 'ice'),
        ],
      ],
      shields: [2, 2],
      startingEnergy: [0, 0],
      switchPolicy: 'adaptive',
    });

    expect(result.switchPolicy).toBe('adaptive');
    expect(result.switchClockMs).toBe(45_000);
    expect(result.switches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        side: 0,
        atMs: 0,
        fromFighterId: 'fire-lead',
        reason: 'adaptive',
        switchReadyAtMs: 45_000,
      }),
    ]));
    expect(result.matchups[0].fighterIds[0]).not.toBe('fire-lead');
  });

  it('charges one turn for a voluntary swap under June 2026 rules', () => {
    const result = simulatePvPTeamBattleLocally({
      kind: 'team-battle',
      mechanics: 'current-2026',
      teams: [
        [
          elementalFighter('fire-lead-current', 'fire'),
          elementalFighter('electric-switch-current', 'electric'),
          elementalFighter('grass-closer-current', 'grass'),
        ],
        [
          elementalFighter('water-lead-current', 'water'),
          elementalFighter('flying-switch-current', 'flying'),
          elementalFighter('ice-closer-current', 'ice'),
        ],
      ],
      shields: [2, 2],
      startingEnergy: [0, 0],
      switchPolicy: 'adaptive',
    });

    expect(result.switches[0]).toEqual(expect.objectContaining({
      side: 0,
      reason: 'adaptive',
      atMs: 0,
    }));
    const openingSwaps = result.switches.filter(
      ({ reason, atMs }) => reason === 'adaptive' && atMs < result.matchups[0].startedAtMs,
    );
    expect(openingSwaps.length).toBeGreaterThan(0);
    expect(result.matchups[0].startedAtMs).toBe(openingSwaps.length * 500);
  });

  it('preserves an unfinished Fast Attack across adaptive team evaluation windows', () => {
    const slowFighter = (id: string): PokemonPvPBattleFighter => ({
      ...fighter(id, 180, 180, 400),
      fastMove: {
        ...fastMove,
        id: `${id}-slow-fast`,
        power: 30,
        energyGain: 0,
        turns: 30,
      },
      chargedMoves: [{
        ...chargedMove,
        id: `${id}-unavailable-charged`,
        energyCost: 100,
      }],
    });
    const sharedRequest = {
      kind: 'team-battle',
      mechanics: 'current-2026',
      teams: [
        [
          slowFighter('slow-left-one'),
          slowFighter('slow-left-two'),
          slowFighter('slow-left-three'),
        ],
        [
          slowFighter('slow-right-one'),
          slowFighter('slow-right-two'),
          slowFighter('slow-right-three'),
        ],
      ],
      shields: [0, 0],
      startingEnergy: [0, 0],
    } satisfies Omit<PvPTeamBattleRequest, 'switchPolicy'>;
    const result = simulatePvPTeamBattleLocally({
      ...sharedRequest,
      switchPolicy: 'adaptive',
    });
    const uninterrupted = simulatePvPTeamBattleLocally({
      ...sharedRequest,
      switchPolicy: 'fixed',
    });

    expect(result.matchups[0].timeMs).toBeGreaterThan(10_000);
    expect(result.matchups[0].hpAfter[0]).toBeLessThan(400);
    expect(result.matchups[0].hpAfter[1]).toBeLessThan(400);
    expect(result.teams).toEqual(uninterrupted.teams);
    expect(result.timeMs).toBe(uninterrupted.timeMs);
  });

  it('keeps fixed order available as a transparent comparison model', () => {
    const result = simulatePvPTeamBattleLocally({
      ...teamBattleRequest,
      switchPolicy: 'fixed',
    });

    expect(result.switchPolicy).toBe('fixed');
    expect(result.switches.every((event) => event.reason === 'forced')).toBe(true);
    expect(result.matchups[0].fighterIds).toEqual([
      'player-lead',
      'opponent-lead',
    ]);
  });

  it('runs a representative team gauntlet locally without API work', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const request = {
      kind: 'team-gauntlet' as const,
      mechanics: 'pvpoke-legacy' as const,
      team: teamBattleRequest.teams[0],
      opponents: [{
        id: 'field-one',
        label: 'Field one',
        team: teamBattleRequest.teams[1],
      }],
      shields: 2,
      switchPolicy: 'adaptive' as const,
    };

    const direct = simulatePvPTeamGauntletLocally(request);
    const worker = await simulatePvPTeamGauntletAsync(request);

    expect(direct.results).toHaveLength(1);
    expect(direct.wins + direct.draws + direct.losses).toBe(1);
    expect(worker.results).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

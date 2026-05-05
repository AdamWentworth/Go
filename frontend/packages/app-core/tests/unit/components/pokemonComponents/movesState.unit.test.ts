import { describe, expect, it } from 'vitest';

import {
  buildMovePools,
  filterMoveOptions,
  findSecondChargedMove,
  FRUSTRATION_MOVE_ID,
  getInitialMoveSelection,
  getMoveById,
  getPowerValue,
  getShadowBonusValue,
  hasMissingFusionMovePool,
  parseSelectedMoveId,
  reconcileShadowPurifiedMoves,
  reconcileUnavailableMoves,
  resolveMovesFusionId,
  RETURN_MOVE_ID,
  shouldRenderMoves,
} from '@/components/pokemonComponents/movesState';
import type { Move } from '@/types/pokemonSubTypes';

const buildMove = (overrides: Partial<Move>): Move => ({
  move_id: 1,
  name: 'Quick Attack',
  type_id: 1,
  raid_power: 8,
  pvp_power: 5,
  raid_energy: 10,
  pvp_energy: 8,
  raid_cooldown: 1,
  pvp_turns: 1,
  is_fast: 1,
  type_name: 'Normal',
  legacy: false,
  type: 'Normal',
  fusion_id: null,
  shadow: null,
  purified: null,
  apex: null,
  ...overrides,
});

describe('movesState', () => {
  it('creates initial move selection from instance data', () => {
    expect(
      getInitialMoveSelection({
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: 3,
      }),
    ).toEqual({ fastMove: 1, chargedMove1: 2, chargedMove2: 3 });
    expect(getInitialMoveSelection(undefined)).toEqual({
      fastMove: null,
      chargedMove1: null,
      chargedMove2: null,
    });
  });

  it('resolves fusion ids from form name, numeric form, and a single move fusion id', () => {
    const moves = [
      buildMove({ move_id: 1, fusion_id: null }),
      buildMove({ move_id: 2, fusion_id: 4 }),
    ];

    expect(
      resolveMovesFusionId({
        allMoves: moves,
        fusionEntries: [{ name: 'White Kyurem', fusion_id: 3 }],
        fusionForm: 'White Kyurem',
      }),
    ).toBe(3);
    expect(
      resolveMovesFusionId({
        allMoves: moves,
        fusionEntries: [],
        fusionForm: '4',
      }),
    ).toBe(4);
    expect(
      resolveMovesFusionId({
        allMoves: [buildMove({ move_id: 2, fusion_id: 4 })],
        fusionEntries: [],
        fusionForm: 'unknown form',
      }),
    ).toBe(4);
    expect(
      resolveMovesFusionId({
        allMoves: [buildMove({ move_id: 2, fusion_id: 4 })],
        fusionEntries: [],
        fusionForm: null,
      }),
    ).toBeNull();
  });

  it('builds move pools for base, fusion, shadow, purified, and missing fusion states', () => {
    const baseFast = buildMove({ move_id: 1, name: 'Dragon Breath', is_fast: 1 });
    const baseCharged = buildMove({ move_id: 2, name: 'Crunch', is_fast: 0 });
    const fusionCharged = buildMove({
      move_id: 999,
      name: 'Fusion Flare',
      is_fast: 0,
      fusion_id: 3,
    });

    const basePool = buildMovePools({
      allMoves: [baseFast, baseCharged, fusionCharged],
      fusionEntries: [{ name: 'White Kyurem', fusion_id: 3 }],
      fusionForm: null,
      fusionMoveSource: 'base',
      isFused: false,
      isShadow: true,
      isPurified: false,
      editMode: true,
    });
    expect(basePool.fastMoves.map((move) => move.move_id)).toEqual([1]);
    expect(basePool.chargedMoves.map((move) => move.move_id)).toEqual([
      2,
      FRUSTRATION_MOVE_ID,
    ]);

    const fusionPool = buildMovePools({
      allMoves: [baseFast, baseCharged, fusionCharged],
      fusionEntries: [{ name: 'White Kyurem', fusion_id: 3 }],
      fusionForm: 'White Kyurem',
      fusionMoveSource: 'base',
      isFused: true,
      isShadow: false,
      isPurified: true,
      editMode: true,
    });
    expect(fusionPool.fusionId).toBe(3);
    expect(fusionPool.chargedMoves.map((move) => move.move_id)).toEqual([
      2,
      999,
      RETURN_MOVE_ID,
    ]);

    const authoritativePool = buildMovePools({
      allMoves: [fusionCharged],
      fusionEntries: [],
      fusionForm: null,
      fusionMoveSource: 'fusion',
      isFused: true,
      isShadow: false,
      isPurified: false,
      editMode: true,
    });
    expect(authoritativePool.chargedMoves.map((move) => move.move_id)).toEqual([999]);

    const missingPool = buildMovePools({
      allMoves: [baseFast, baseCharged],
      fusionEntries: [],
      fusionForm: null,
      fusionMoveSource: 'fusion_missing',
      isFused: true,
      isShadow: false,
      isPurified: false,
      editMode: true,
    });
    expect(missingPool.fastMoves).toEqual([]);
    expect(missingPool.chargedMoves).toEqual([]);
    expect(missingPool.disableMoveEditing).toBe(true);
  });

  it('looks up selected moves including generated special moves', () => {
    const allMoves = [buildMove({ move_id: 1, is_fast: 1 })];
    const chargedMoves = [buildMove({ move_id: FRUSTRATION_MOVE_ID, name: 'Frustration', is_fast: 0 })];

    expect(getMoveById(1, allMoves, chargedMoves)?.name).toBe('Quick Attack');
    expect(getMoveById(FRUSTRATION_MOVE_ID, allMoves, chargedMoves)?.name).toBe('Frustration');
    expect(getMoveById(null, allMoves, chargedMoves)).toBeNull();
  });

  it('computes power values and shadow bonus values', () => {
    const move = buildMove({ raid_power: 5, pvp_power: 45 });

    expect(getPowerValue(move, 'raid')).toBe(5);
    expect(getPowerValue(move, 'pvp')).toBe(45);
    expect(getPowerValue(buildMove({ raid_power: Number.NaN }), 'raid')).toBeNull();
    expect(getShadowBonusValue(5)).toBe(1);
    expect(getShadowBonusValue(90)).toBe(18);
  });

  it('reconciles Frustration and Return when shadow or purified state changes', () => {
    expect(
      reconcileShadowPurifiedMoves({
        selection: { fastMove: 1, chargedMove1: FRUSTRATION_MOVE_ID, chargedMove2: null },
        isShadow: false,
        isPurified: true,
      }),
    ).toEqual({
      selection: { fastMove: 1, chargedMove1: RETURN_MOVE_ID, chargedMove2: null },
      dirty: true,
    });

    expect(
      reconcileShadowPurifiedMoves({
        selection: { fastMove: 1, chargedMove1: RETURN_MOVE_ID, chargedMove2: null },
        isShadow: false,
        isPurified: false,
      }),
    ).toEqual({
      selection: { fastMove: 1, chargedMove1: null, chargedMove2: null },
      dirty: true,
    });
  });

  it('clears unavailable moves and duplicate charged selections', () => {
    expect(
      reconcileUnavailableMoves({
        selection: { fastMove: 7, chargedMove1: 2, chargedMove2: 2 },
        fastMoves: [buildMove({ move_id: 1, is_fast: 1 })],
        chargedMoves: [buildMove({ move_id: 2, is_fast: 0 })],
        hasMissingFusionMoves: false,
      }),
    ).toEqual({
      selection: { fastMove: null, chargedMove1: 2, chargedMove2: null },
      dirty: true,
    });

    expect(
      reconcileUnavailableMoves({
        selection: { fastMove: 7, chargedMove1: 2, chargedMove2: null },
        fastMoves: [],
        chargedMoves: [],
        hasMissingFusionMoves: true,
      }),
    ).toEqual({
      selection: { fastMove: 7, chargedMove1: 2, chargedMove2: null },
      dirty: false,
    });
  });

  it('filters select options by slot, duplicate selections, and shadow or purified availability', () => {
    const moves = [
      buildMove({ move_id: 2, name: 'Crunch', is_fast: 0 }),
      buildMove({ move_id: 3, name: 'Shadow Only', is_fast: 0, shadow: 1 }),
      buildMove({ move_id: 4, name: 'Purified Only', is_fast: 0, purified: 1 }),
    ];

    expect(
      filterMoveOptions({
        moves,
        slot: 'charged1',
        chargedMove1: null,
        chargedMove2: 2,
        isShadow: false,
        isPurified: false,
      }).map((move) => move.move_id),
    ).toEqual([]);

    expect(
      filterMoveOptions({
        moves,
        slot: 'charged2',
        chargedMove1: 2,
        chargedMove2: null,
        isShadow: true,
        isPurified: false,
      }).map((move) => move.move_id),
    ).toEqual([3]);
  });

  it('finds the first legal second charged move and ignores special moves', () => {
    const secondMove = buildMove({ move_id: 4, name: 'Thunderbolt', is_fast: 0 });
    expect(
      findSecondChargedMove(
        [
          buildMove({ move_id: 2, is_fast: 0 }),
          buildMove({ move_id: FRUSTRATION_MOVE_ID, is_fast: 0 }),
          buildMove({ move_id: RETURN_MOVE_ID, is_fast: 0 }),
          secondMove,
        ],
        2,
      ),
    ).toBe(secondMove);
  });

  it('parses selected move ids and determines whether Moves should render', () => {
    expect(parseSelectedMoveId('2')).toBe(2);
    expect(parseSelectedMoveId('')).toBeNull();
    expect(hasMissingFusionMovePool(true, 'fusion_missing')).toBe(true);

    expect(
      shouldRenderMoves({
        editMode: false,
        selection: { fastMove: null, chargedMove1: null, chargedMove2: null },
        hasMissingFusionMoves: false,
      }),
    ).toBe(false);
    expect(
      shouldRenderMoves({
        editMode: false,
        selection: { fastMove: null, chargedMove1: null, chargedMove2: null },
        hasMissingFusionMoves: true,
      }),
    ).toBe(true);
  });
});

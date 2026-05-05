import { describe, expect, it } from 'vitest';

import { resolveFusionMovePool } from '@/features/pokemonDisplay/fusionMovePool';
import type { Move, Fusion } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const buildMove = (overrides: Partial<Move>): Move => ({
  move_id: 1,
  name: 'Dragon Breath',
  type_id: 3,
  raid_power: 6,
  pvp_power: 4,
  raid_energy: 4,
  pvp_energy: 3,
  raid_cooldown: 500,
  pvp_turns: 1,
  is_fast: 1,
  type_name: 'Dragon',
  legacy: false,
  type: 'dragon',
  fusion_id: null,
  shadow: null,
  purified: null,
  apex: null,
  ...overrides,
});

describe('resolveFusionMovePool', () => {
  it('returns base moves unchanged when not fused', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: { moves: baseMoves, fusion: [] } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: { is_fused: false },
    });

    expect(result.source).toBe('base');
    expect(result.fusionId).toBeNull();
    expect(result.moves.map((move) => move.name)).toEqual(['Dragon Breath', 'Dragon Claw']);
  });

  it('returns strict fusion moves when fused and fusion.moves exists', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
      buildMove({ move_id: 269, name: 'Glaciate', is_fast: 0 }),
    ];
    const fusionMoves = [
      buildMove({ move_id: 67, name: 'Ice Fang', is_fast: 1 }),
      buildMove({ move_id: 125, name: 'Dragon Pulse', is_fast: 0 }),
      buildMove({ move_id: 467, name: 'Ice Burn', is_fast: 0 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: baseMoves,
        fusion: [
          {
            fusion_id: 3,
            base_pokemon_id2: 643,
            name: 'White Kyurem',
            moves: fusionMoves,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(3);
    expect(result.moves.map((move) => move.name)).toEqual([
      'Ice Fang',
      'Dragon Pulse',
      'Ice Burn',
    ]);
    expect(result.moves.some((move) => move.name === 'Dragon Breath')).toBe(false);
  });

  it('matches fusion by slug-normalized form text', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
    ];
    const fusionMoves = [
      buildMove({ move_id: 14, name: 'Shadow Claw', is_fast: 1, fusion_id: 4 }),
      buildMove({ move_id: 87, name: 'Stone Edge', is_fast: 0, fusion_id: 4 }),
      buildMove({ move_id: 267, name: 'Fusion Bolt', is_fast: 0, fusion_id: 4 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: baseMoves,
        fusion: [
          {
            fusion_id: 4,
            base_pokemon_id2: 644,
            name: 'Black Kyurem',
            moves: fusionMoves,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'black_kyurem',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(4);
    expect(result.moves.map((move) => move.name)).toEqual([
      'Shadow Claw',
      'Stone Edge',
      'Fusion Bolt',
    ]);
    expect(result.moves.some((move) => move.name === 'Dragon Breath')).toBe(false);
  });

  it('matches fusion by legacy fusion_form id token', () => {
    const fusionMoves = [
      buildMove({ move_id: 14, name: 'Shadow Claw', is_fast: 1, fusion_id: 4 }),
      buildMove({ move_id: 267, name: 'Fusion Bolt', is_fast: 0, fusion_id: 4 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: [buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 })],
        fusion: [
          {
            fusion_id: 4,
            base_pokemon_id2: 644,
            name: 'Black Kyurem',
            moves: fusionMoves,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'fusion_4',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(4);
    expect(result.moves.map((move) => move.name)).toEqual(['Shadow Claw', 'Fusion Bolt']);
  });

  it('matches fusion by stored fusion object when fusion_form is missing', () => {
    const fusionMoves = [
      buildMove({ move_id: 67, name: 'Ice Fang', is_fast: 1, fusion_id: 3 }),
      buildMove({ move_id: 467, name: 'Ice Burn', is_fast: 0, fusion_id: 3 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: [buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 })],
        fusion: [
          {
            fusion_id: 3,
            base_pokemon_id2: 643,
            name: 'White Kyurem',
            moves: fusionMoves,
          } as Fusion,
          {
            fusion_id: 4,
            base_pokemon_id2: 644,
            name: 'Black Kyurem',
            moves: [buildMove({ move_id: 14, name: 'Shadow Claw', is_fast: 1, fusion_id: 4 })],
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: null,
        storedFusionObject: { 3: true },
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(3);
    expect(result.moves.map((move) => move.name)).toEqual(['Ice Fang', 'Ice Burn']);
  });

  it('falls back to top-level fusion-tagged moves when fusion entry has no moves array', () => {
    const result = resolveFusionMovePool({
      pokemon: {
        moves: [
          buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1, fusion_id: null }),
          buildMove({ move_id: 67, name: 'Ice Fang', is_fast: 1, fusion_id: 3 }),
          buildMove({ move_id: 110, name: 'Ancient Power', is_fast: 0, fusion_id: 3 }),
          buildMove({ move_id: 466, name: 'Freeze Shock', is_fast: 0, fusion_id: 4 }),
        ],
        fusion: [{ fusion_id: 3, base_pokemon_id2: 643, name: 'White Kyurem' } as Fusion],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(3);
    expect(result.moves.map((move) => move.name)).toEqual(['Ice Fang', 'Ancient Power']);
    expect(result.moves.some((move) => move.name === 'Freeze Shock')).toBe(false);
  });

  it('derives fusion id from variant metadata when fusion_form is mismatched', () => {
    const result = resolveFusionMovePool({
      pokemon: {
        variantType: 'fusion_1',
        fusion_id: 1,
        moves: [
          buildMove({ move_id: 29, name: 'Metal Claw', is_fast: 1, fusion_id: null }),
          buildMove({ move_id: 301, name: 'Sunsteel Strike', is_fast: 0, fusion_id: 1 }),
          buildMove({ move_id: 296, name: 'Moongeist Beam', is_fast: 0, fusion_id: 2 }),
        ],
        fusion: [
          { fusion_id: 1, base_pokemon_id2: 791, name: 'Dusk Mane Necrozma' } as Fusion,
          { fusion_id: 2, base_pokemon_id2: 792, name: 'Dusk Wings Necrozma' } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion' | 'fusion_id' | 'variantType'>,
      fusion: {
        is_fused: true,
        fusion_form: 'Dawn Wings Necrozma',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(1);
    expect(result.moves.map((move) => move.name)).toEqual(['Sunsteel Strike']);
  });

  it('returns fusion_missing when fused but no fusion move pool is available', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: baseMoves,
        fusion: [{ fusion_id: 4, base_pokemon_id2: 644, name: 'Black Kyurem' } as Fusion],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'Black Kyurem',
      },
    });

    expect(result.source).toBe('fusion_missing');
    expect(result.fusionId).toBe(4);
    expect(result.moves).toEqual([]);
  });

  it('prefers active fusion_form over historical stored fusion ids', () => {
    const result = resolveFusionMovePool({
      pokemon: {
        moves: [
          buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1, fusion_id: null }),
          buildMove({ move_id: 301, name: 'Sunsteel Strike', is_fast: 0, fusion_id: 1 }),
          buildMove({ move_id: 296, name: 'Moongeist Beam', is_fast: 0, fusion_id: 2 }),
        ],
        fusion: [
          {
            fusion_id: 1,
            base_pokemon_id2: 791,
            name: 'Dusk Mane Necrozma',
            moves: [buildMove({ move_id: 301, name: 'Sunsteel Strike', is_fast: 0, fusion_id: 1 })],
          } as Fusion,
          {
            fusion_id: 2,
            base_pokemon_id2: 792,
            name: 'Dawn Wings Necrozma',
            moves: [buildMove({ move_id: 296, name: 'Moongeist Beam', is_fast: 0, fusion_id: 2 })],
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'Dawn Wings Necrozma',
        storedFusionObject: { 1: true, 2: true },
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(2);
    expect(result.moves.map((move) => move.name)).toEqual(['Dragon Breath', 'Moongeist Beam']);
  });
});

import { describe, expect, it } from 'vitest';

import { resolveFusionMovePool } from '@/pages/Pokemon/features/instances/utils/resolveFusionMovePool';
import type { Instances } from '@/types/instances';
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

const makeVariant = (input: {
  pokemon_id: number;
  variant_id: string;
  variantType?: PokemonVariant['variantType'];
  moves: Move[];
}): PokemonVariant =>
  ({
    pokemon_id: input.pokemon_id,
    variant_id: input.variant_id,
    variantType: input.variantType ?? 'default',
    moves: input.moves,
  }) as unknown as PokemonVariant;

describe('resolveFusionMovePool', () => {
  it('returns base moves unchanged when not fused', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
    ];

    const result = resolveFusionMovePool({
      pokemon: { moves: baseMoves, fusion: [] } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: { is_fused: false },
      instances: {} as Instances,
      variants: [],
    });

    expect(result.map((move) => move.name)).toEqual(['Dragon Breath', 'Dragon Claw']);
  });

  it('injects signature fusion move from fused partner instance immediately', () => {
    const baseMoves = [
      buildMove({ move_id: 5, name: 'Dragon Breath', is_fast: 1 }),
      buildMove({ move_id: 82, name: 'Dragon Claw', is_fast: 0 }),
      buildMove({ move_id: 269, name: 'Glaciate', is_fast: 0 }),
    ];
    const partnerMoves = [
      buildMove({ move_id: 40, name: 'Fire Fang', is_fast: 1 }),
      buildMove({ move_id: 266, name: 'Fusion Flare', is_fast: 0, legacy: true }),
    ];

    const result = resolveFusionMovePool({
      pokemon: {
        moves: baseMoves,
        fusion: [{ fusion_id: 3, base_pokemon_id2: 643, name: 'White Kyurem' } as Fusion],
      } as unknown as Pick<PokemonVariant, 'moves' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
        fusedWith: 'partner-1',
      },
      instances: {
        'partner-1': {
          instance_id: 'partner-1',
          variant_id: '0643-default',
          pokemon_id: 643,
        },
      } as unknown as Instances,
      variants: [
        makeVariant({
          pokemon_id: 643,
          variant_id: '0643-default',
          moves: partnerMoves,
        }),
      ],
    });

    expect(result.some((move) => move.name === 'Fusion Flare')).toBe(true);
    expect(result.some((move) => move.name === 'Fire Fang')).toBe(false);
  });

  it('falls back to fusion base_pokemon_id2 when fusedWith lookup is unavailable', () => {
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
        fusedWith: 'missing-partner',
      },
      instances: {} as Instances,
      variants: [
        makeVariant({
          pokemon_id: 644,
          variant_id: '0644-default',
          moves: [
            buildMove({ move_id: 13, name: 'Charge Beam', is_fast: 1 }),
            buildMove({ move_id: 267, name: 'Fusion Bolt', is_fast: 0, legacy: true }),
          ],
        }),
      ],
    });

    expect(result.some((move) => move.name === 'Fusion Bolt')).toBe(true);
    expect(result.some((move) => move.name === 'Charge Beam')).toBe(false);
  });
});


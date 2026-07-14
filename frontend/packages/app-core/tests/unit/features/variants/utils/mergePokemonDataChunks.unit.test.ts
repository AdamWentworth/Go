import { describe, expect, it } from 'vitest';

import {
  mergePokemonMovesChunk,
  mergePokemonRaidDataChunk,
} from '@/features/variants/utils/mergePokemonDataChunks';
import type { PokemonVariant } from '@/types/pokemonVariants';

const makeVariant = (variantType: PokemonVariant['variantType']): PokemonVariant =>
  ({
    pokemon_id: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    form: null,
    variantType,
    variant_id: `0001-${variantType}`,
    moves: [],
    fusion: [{ fusion_id: 9, moves: [] }],
    crownForms: [{ id: 7, moves: [] }],
  }) as unknown as PokemonVariant;

describe('mergePokemonDataChunks', () => {
  it('hydrates base, fusion, and crown move pools without rebuilding catalog variants', () => {
    const variants = [makeVariant('default')];

    const merged = mergePokemonMovesChunk(variants, [
      {
        pokemon_id: 1,
        moves: [{ move_id: 1, name: 'Tackle' } as any],
        fusion: [{ fusion_id: 9, moves: [{ move_id: 2, name: 'Fusion Bolt' } as any] }],
        crownForms: [{ id: 7, moves: [{ move_id: 3, name: 'Crown Strike' } as any] }],
      },
    ]);

    expect(merged[0]?.variant_id).toBe('0001-default');
    expect(merged[0]?.moves.map((move) => move.name)).toEqual(['Tackle']);
    expect(merged[0]?.fusion?.[0]?.moves?.map((move) => move.name)).toEqual(['Fusion Bolt']);
    expect(merged[0]?.crownForms?.[0]?.moves?.map((move) => move.name)).toEqual(['Crown Strike']);
  });

  it('assigns raid metadata to matching variants only', () => {
    const variants = [makeVariant('default'), makeVariant('shadow')];

    const merged = mergePokemonRaidDataChunk(variants, [
      {
        pokemon_id: 1,
        raid_boss: [
          {
            id: 1,
            pokemon_id: 1,
            name: 'Shadow Bulbasaur',
            form: '',
            tier: 'shadow_1',
          } as any,
        ],
      },
    ]);

    expect(merged[0]?.raid_boss).toBeUndefined();
    expect(merged[1]?.raid_boss?.map((boss) => boss.name)).toEqual(['Shadow Bulbasaur']);
  });
});

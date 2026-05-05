import { describe, expect, it } from 'vitest';

import { resolveCrownMovePool } from '@/features/pokemonDisplay/crownMovePool';
import type { CrownForm, Move } from '@/types/pokemonSubTypes';

const baseMoves: Move[] = [
  {
    move_id: 20,
    name: 'Quick Attack',
    type_id: 1,
    raid_power: 8,
    pvp_power: 5,
    raid_energy: 10,
    pvp_energy: 8,
    raid_cooldown: 1000,
    pvp_turns: 2,
    is_fast: 1,
    type_name: 'Normal',
    legacy: false,
    type: 'normal',
  },
];

const crownMoves: Move[] = [
  {
    move_id: 999,
    name: 'Behemoth Blade',
    type_id: 17,
    raid_power: 100,
    pvp_power: 100,
    raid_energy: -50,
    pvp_energy: -50,
    raid_cooldown: 2000,
    pvp_turns: 1,
    is_fast: 0,
    type_name: 'Steel',
    legacy: false,
    type: 'steel',
  },
];

const crownForms: CrownForm[] = [
  {
    id: 1,
    base_pokemon_id: 2290,
    crown_pokemon_id: 888,
    display_form: 'Crowned Sword',
    name: 'Zacian',
    form: 'Crowned_sword',
    type_1_id: 5,
    moves: crownMoves,
  },
];

describe('resolveCrownMovePool', () => {
  it('returns base moves when crown is not active', () => {
    const result = resolveCrownMovePool({
      pokemon: { crownForms },
      baseMoves,
      crown: {
        is_crown: false,
        crown_form: null,
      },
    });

    expect(result.source).toBe('base');
    expect(result.moves).toEqual(baseMoves);
    expect(result.crownPokemonId).toBeNull();
  });

  it('returns crown moves when crown form moves exist', () => {
    const result = resolveCrownMovePool({
      pokemon: { crownForms },
      baseMoves,
      crown: {
        is_crown: true,
        crown_form: 'Crowned Sword',
      },
    });

    expect(result.source).toBe('crown');
    expect(result.moves).toEqual(crownMoves);
    expect(result.crownPokemonId).toBe(888);
  });

  it('falls back to base moves when crown form has no move rows', () => {
    const result = resolveCrownMovePool({
      pokemon: {
        crownForms: [
          {
            ...crownForms[0],
            moves: [],
          },
        ],
      },
      baseMoves,
      crown: {
        is_crown: true,
        crown_form: 'Crowned Sword',
      },
    });

    expect(result.source).toBe('crown_missing');
    expect(result.moves).toEqual(baseMoves);
    expect(result.crownPokemonId).toBe(888);
  });
});

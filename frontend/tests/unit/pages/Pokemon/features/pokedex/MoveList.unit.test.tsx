import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import MoveList from '@/pages/Pokemon/features/pokedex/MoveList';
import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const pokemon = {
  variantType: 'default',
  currentImage: '/images/default/pokemon_1.png',
  species_name: 'Bulbasaur',
} as PokemonVariant;

const buildMove = (overrides: Partial<Move>): Move =>
  ({
    move_id: 1,
    name: 'Tackle',
    type_id: 1,
    raid_power: 5,
    pvp_power: 3,
    raid_energy: 5,
    pvp_energy: 5,
    raid_cooldown: 1,
    pvp_turns: 1,
    is_fast: 1,
    type_name: 'Normal',
    legacy: false,
    type: 'normal',
    ...overrides,
  }) as Move;

describe('MoveList', () => {
  it('renders without crashing when type_name is missing but type exists', () => {
    render(
      <MoveList
        pokemon={pokemon}
        moves={[
          buildMove({
            move_id: 101,
            name: 'Water Gun',
            type_name: undefined as unknown as string,
            type: 'water',
          }),
        ]}
      />,
    );

    const icon = screen.getByRole('img', { name: /water type/i });
    expect(icon).toHaveAttribute('src', expect.stringContaining('/images/types/water.png'));
    expect(screen.getByText('Water Gun')).toBeInTheDocument();
  });

  it('falls back safely when both type and move name are missing', () => {
    render(
      <MoveList
        pokemon={pokemon}
        moves={[
          buildMove({
            move_id: 202,
            name: undefined as unknown as string,
            type_name: undefined as unknown as string,
            type: undefined as unknown as string,
            is_fast: 0,
          }),
        ]}
      />,
    );

    const icon = screen.getByRole('img', { name: /unknown type/i });
    expect(icon).toHaveAttribute('src', expect.stringContaining('/images/types/normal.png'));
    expect(screen.getByText('Unknown Move')).toBeInTheDocument();
  });
});

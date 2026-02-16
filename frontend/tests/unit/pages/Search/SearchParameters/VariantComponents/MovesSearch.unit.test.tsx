import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import MovesSearch from '@/pages/Search/SearchParameters/VariantComponents/MovesSearch';

const pokemonWithMoves = {
  moves: [
    { move_id: 1, name: 'Quick Attack', is_fast: 1, type: 'normal', type_name: 'Normal' },
    { move_id: 2, name: 'Flame Charge', is_fast: 0, type: 'fire', type_name: 'Fire' },
    { move_id: 3, name: 'Hydro Pump', is_fast: 0, type: 'water', type_name: 'Water' },
  ],
};

describe('MovesSearch', () => {
  it('emits selected moves when inputs change', async () => {
    const onMovesChange = vi.fn();

    render(
      <MovesSearch
        pokemon={pokemonWithMoves}
        selectedMoves={{ fastMove: null, chargedMove1: null, chargedMove2: null }}
        onMovesChange={onMovesChange}
      />,
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1' } });
    fireEvent.change(selects[1], { target: { value: '2' } });

    await waitFor(() => {
      const lastCall = onMovesChange.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({
        fastMove: 1,
        chargedMove1: 2,
      });
    });
  });

  it('adds a second charged move from available charged options', async () => {
    const onMovesChange = vi.fn();

    render(
      <MovesSearch
        pokemon={pokemonWithMoves}
        selectedMoves={{ fastMove: null, chargedMove1: null, chargedMove2: null }}
        onMovesChange={onMovesChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => {
      const lastCall = onMovesChange.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({ chargedMove2: 2 });
    });
  });

  it('does not crash when selected move has missing type icon metadata', () => {
    const onMovesChange = vi.fn();

    const pokemonWithMissingType = {
      moves: [
        { move_id: 10, name: 'Unknown Move', is_fast: 1 },
        { move_id: 11, name: 'Charged Move', is_fast: 0 },
      ],
    };

    expect(() => {
      render(
        <MovesSearch
          pokemon={pokemonWithMissingType}
          selectedMoves={{ fastMove: 10, chargedMove1: 11, chargedMove2: null }}
          onMovesChange={onMovesChange}
        />,
      );
    }).not.toThrow();
  });
});

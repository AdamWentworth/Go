import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import MoveSelector from '@/pages/Raid/MoveSelector';

describe('MoveSelector', () => {
  it('renders move options with selected value', () => {
    const moves = [{ name: 'Quick Attack' }, { name: 'Tackle' }];

    render(
      <MoveSelector
        moves={moves}
        selectedMove={moves[1]}
        onMoveSelect={vi.fn()}
        moveType="Fast"
      />,
    );

    expect(screen.getByText('Fast Move:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('Tackle');
    expect(screen.getByRole('option', { name: 'Quick Attack' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tackle' })).toBeInTheDocument();
  });

  it('emits selected move object and supports clearing selection', () => {
    const moves = [{ name: 'Power-Up Punch' }, { name: 'Close Combat' }];
    const onMoveSelect = vi.fn();

    render(
      <MoveSelector
        moves={moves}
        selectedMove={null}
        onMoveSelect={onMoveSelect}
        moveType="Charged"
      />,
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Close Combat' } });
    fireEvent.change(select, { target: { value: '' } });

    expect(onMoveSelect).toHaveBeenNthCalledWith(1, moves[1]);
    expect(onMoveSelect).toHaveBeenNthCalledWith(2, undefined);
  });
});


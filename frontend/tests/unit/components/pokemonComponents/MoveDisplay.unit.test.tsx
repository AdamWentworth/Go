import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import MoveDisplay from '@/components/pokemonComponents/MoveDisplay';

describe('MoveDisplay', () => {
  it('does not crash when moves are missing', () => {
    render(
      <MoveDisplay
        fastMoveId={1}
        chargedMove1Id={2}
        chargedMove2Id={3}
        moves={undefined}
      />,
    );

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders available moves and legacy marker', () => {
    render(
      <MoveDisplay
        fastMoveId={1}
        chargedMove1Id={2}
        chargedMove2Id={null}
        moves={[
          { move_id: 1, name: 'Tackle', type: 'normal', type_name: 'Normal' },
          { move_id: 2, name: 'Hydro Pump', type: 'water', type_name: 'Water', legacy: true },
        ]}
      />,
    );

    expect(screen.getByText('Tackle')).toBeInTheDocument();
    expect(screen.getByText('Hydro Pump*')).toBeInTheDocument();
  });
});


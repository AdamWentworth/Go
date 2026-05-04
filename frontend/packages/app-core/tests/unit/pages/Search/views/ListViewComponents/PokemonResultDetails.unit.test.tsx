import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PokemonResultDetails from '@/pages/Search/views/ListViewComponents/PokemonResultDetails';

vi.mock('@/components/pokemonComponents/FriendshipLevel', () => ({
  default: ({ level, prefLucky }: { level: number; prefLucky: boolean }) => (
    <div data-testid="friendship-level">
      Friendship:{level}:{String(prefLucky)}
    </div>
  ),
}));

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: ({
    fastMoveId,
    chargedMove1Id,
    chargedMove2Id,
  }: {
    fastMoveId: number | null;
    chargedMove1Id: number | null;
    chargedMove2Id: number | null;
  }) => (
    <div data-testid="move-display">
      Moves:{fastMoveId ?? 'none'}:{chargedMove1Id ?? 'none'}:
      {chargedMove2Id ?? 'none'}
    </div>
  ),
}));

describe('PokemonResultDetails', () => {
  it('renders the populated detail column with stable UI classes', () => {
    const formatDate = vi.fn((dateString: string) => `formatted:${dateString}`);
    const { container } = render(
      <PokemonResultDetails
        friendshipLevel={3}
        prefLucky
        weight={12.3}
        height={1.1}
        fastMoveId={1}
        chargedMove1Id={2}
        chargedMove2Id={3}
        moves={[
          {
            move_id: 1,
            name: 'Vine Whip',
            type: 'grass',
            type_name: 'Grass',
          },
        ]}
        locationCaught="Seattle"
        dateCaught="2026-02-10T12:00:00.000Z"
        formatDate={formatDate}
      />,
    );

    expect(container.querySelector('.pokemon-second-column')).toBeInTheDocument();
    expect(container.querySelector('.pokemon-friendship')).toBeInTheDocument();
    expect(screen.getByTestId('friendship-level')).toHaveTextContent(
      'Friendship:3:true',
    );
    expect(container.querySelector('.pokemon-weight')).toHaveTextContent('12.3kg');
    expect(container.querySelector('.pokemon-height')).toHaveTextContent('1.1m');
    expect(container.querySelector('.pokemon-moves')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toHaveTextContent('Moves:1:2:3');
    expect(container.querySelector('.pokemon-location')).toHaveTextContent(
      'Location Caught: Seattle',
    );
    expect(container.querySelector('.pokemon-date')).toHaveTextContent(
      'Date Caught: formatted:2026-02-10T12:00:00.000Z',
    );
    expect(formatDate).toHaveBeenCalledWith('2026-02-10T12:00:00.000Z');
  });

  it('omits optional details when values are empty', () => {
    const formatDate = vi.fn((dateString: string) => dateString);
    const { container } = render(
      <PokemonResultDetails
        friendshipLevel={0}
        prefLucky={false}
        weight={0}
        height={null}
        fastMoveId={null}
        chargedMove1Id={null}
        chargedMove2Id={null}
        moves={[]}
        locationCaught=""
        dateCaught=""
        formatDate={formatDate}
      />,
    );

    expect(container.querySelector('.pokemon-second-column')).toBeInTheDocument();
    expect(container.querySelector('.pokemon-weight-height')).toBeInTheDocument();
    expect(screen.queryByTestId('friendship-level')).not.toBeInTheDocument();
    expect(screen.queryByTestId('move-display')).not.toBeInTheDocument();
    expect(container.querySelector('.pokemon-weight')).not.toBeInTheDocument();
    expect(container.querySelector('.pokemon-height')).not.toBeInTheDocument();
    expect(container.querySelector('.pokemon-location')).not.toBeInTheDocument();
    expect(container.querySelector('.pokemon-date')).not.toBeInTheDocument();
    expect(formatDate).not.toHaveBeenCalled();
  });
});

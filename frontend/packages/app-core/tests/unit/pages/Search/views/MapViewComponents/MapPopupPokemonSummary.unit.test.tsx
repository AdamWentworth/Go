import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import MapPopupPokemonSummary from '@/pages/Search/views/MapViewComponents/MapPopupPokemonSummary';

const moveDisplaySpy = vi.fn((_: unknown) => <div data-testid="move-display" />);

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: (props: unknown) => moveDisplaySpy(props),
}));

describe('MapPopupPokemonSummary', () => {
  it('renders the image, display name, moves, and click handler', () => {
    const onClick = vi.fn();
    const { container } = render(
      <MapPopupPokemonSummary
        className="trade-popup-content"
        imageUrl="/images/mock.png"
        pokemonDisplayName="Charizard"
        fastMoveId={1}
        chargedMove1Id={2}
        chargedMove2Id={3}
        moves={[
          {
            move_id: 1,
            name: 'Fire Spin',
            type: 'fire',
            type_name: 'Fire',
          },
        ]}
        onClick={onClick}
      />,
    );

    const summary = container.querySelector('.trade-popup-content') as Element;
    expect(summary).toBeInTheDocument();
    expect(screen.getByAltText('Charizard Image')).toHaveClass('pokemon-image');
    expect(screen.getByText('Charizard')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
    expect(moveDisplaySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        fastMoveId: 1,
        chargedMove1Id: 2,
        chargedMove2Id: 3,
      }),
    );

    fireEvent.click(summary);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps details visible when there is no image', () => {
    render(
      <MapPopupPokemonSummary
        className="caught-popup-content"
        imageUrl={null}
        pokemonDisplayName="Unknown"
        moves={[]}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
  });
});

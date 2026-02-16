import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CaughtPopup from '@/pages/Search/views/MapViewComponents/CaughtPopup';

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: () => <div data-testid="iv" />,
}));

const moveDisplaySpy = vi.fn((_: unknown) => <div data-testid="move-display" />);

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: (props: unknown) => moveDisplaySpy(props),
}));

vi.mock('@/pages/Search/utils/URLSelect', () => ({
  URLSelect: () => '/images/mock.png',
}));

vi.mock('@/pages/Search/utils/getPokemonDisplayName', () => ({
  default: () => 'Eevee',
}));

const baseItem = {
  username: 'brock',
  instance_id: 'inst-3',
  fast_move_id: 1,
  charged_move1Id: 11,
  charged_move2_id: 3,
  pokemonInfo: { moves: [] },
};

describe('CaughtPopup', () => {
  const navigateToUserCatalog = vi.fn();

  beforeEach(() => {
    navigateToUserCatalog.mockReset();
    moveDisplaySpy.mockClear();
  });

  it('renders popup and supports legacy charged_move1Id key', () => {
    render(
      <CaughtPopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
      />,
    );

    expect(screen.getByText('brock')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
    expect(screen.getByTestId('iv')).toBeInTheDocument();
    expect(screen.getByAltText('Eevee Image')).toBeInTheDocument();

    const moveDisplayProps = moveDisplaySpy.mock.calls[0]?.[0] as {
      chargedMove1Id?: number | null;
    };
    expect(moveDisplayProps.chargedMove1Id).toBe(11);
  });

  it('opens confirmation and confirms navigation to caught catalog', () => {
    const { container } = render(
      <CaughtPopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
      />,
    );

    fireEvent.click(container.querySelector('.caught-popup-container') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(navigateToUserCatalog).toHaveBeenCalledWith('brock', 'inst-3', 'Caught');
  });
});

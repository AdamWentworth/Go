import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import WantedPopup from '@/pages/Search/views/MapViewComponents/WantedPopup';

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: () => <div data-testid="iv" />,
}));

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: () => <div data-testid="move-display" />,
}));

vi.mock('@/pages/Search/utils/URLSelect', () => ({
  URLSelect: () => '/images/mock.png',
}));

vi.mock('@/pages/Search/utils/getPokemonDisplayName', () => ({
  default: () => 'Bulbasaur',
}));

const baseItem = {
  username: 'ash',
  instance_id: 'inst-1',
  fast_move_id: 1,
  charged_move1_id: 2,
  charged_move2_id: 3,
  pokemonInfo: { moves: [] },
  trade_list: {
    'variant-1_uuid-1': { match: true },
  },
};

describe('WantedPopup', () => {
  const navigateToUserCatalog = vi.fn();
  const findPokemonByKey = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    navigateToUserCatalog.mockReset();
    findPokemonByKey.mockReset();
    onClose.mockReset();
  });

  it('renders popup content and trade list match image', () => {
    findPokemonByKey.mockReturnValue({
      currentImage: '/images/variant.png',
      name: 'Bulbasaur',
      form: null,
    });

    render(
      <WantedPopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
        findPokemonByKey={findPokemonByKey}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('ash')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
    expect(screen.getByTestId('iv')).toBeInTheDocument();
    expect(screen.getByAltText('Bulbasaur Image')).toBeInTheDocument();
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument();
    expect(findPokemonByKey).toHaveBeenCalledWith(
      'variant-1_uuid-1',
      baseItem.trade_list['variant-1_uuid-1'],
    );
  });

  it('opens confirmation and confirms navigation to wanted catalog', () => {
    findPokemonByKey.mockReturnValue(null);

    const { container } = render(
      <WantedPopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
        findPokemonByKey={findPokemonByKey}
        onClose={onClose}
      />,
    );

    fireEvent.click(container.querySelector('.wanted-popup-content') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(navigateToUserCatalog).toHaveBeenCalledWith('ash', 'inst-1', 'Wanted');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes popup when clicking wrapper outside content', () => {
    findPokemonByKey.mockReturnValue(null);

    const { container } = render(
      <WantedPopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
        findPokemonByKey={findPokemonByKey}
        onClose={onClose}
      />,
    );

    fireEvent.click(container.querySelector('.wanted-popup-wrapper') as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

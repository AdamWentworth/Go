import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradePopup from '@/pages/Search/views/MapViewComponents/TradePopup';

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
  default: () => 'Charizard',
}));

const baseItem = {
  username: 'misty',
  instance_id: 'inst-2',
  fast_move_id: 1,
  charged_move1_id: 2,
  charged_move2_id: 3,
  pokemonInfo: { moves: [] },
  wanted_list: {
    'variant-1_uuid-9': { match: true },
  },
};

describe('TradePopup', () => {
  const navigateToUserCatalog = vi.fn();
  const findPokemonByKey = vi.fn();

  beforeEach(() => {
    navigateToUserCatalog.mockReset();
    findPokemonByKey.mockReset();
  });

  it('renders popup content and wanted list match image', () => {
    findPokemonByKey.mockReturnValue({
      currentImage: '/images/variant.png',
      name: 'Bulbasaur',
      form: null,
    });

    render(
      <TradePopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
        findPokemonByKey={findPokemonByKey}
      />,
    );

    expect(screen.getByText('misty')).toBeInTheDocument();
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
    expect(screen.getByTestId('iv')).toBeInTheDocument();
    expect(screen.getByAltText('Charizard Image')).toBeInTheDocument();
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument();
    expect(findPokemonByKey).toHaveBeenCalledWith(
      'variant-1_uuid-9',
      baseItem.wanted_list['variant-1_uuid-9'],
    );
  });

  it('opens confirmation and confirms navigation to trade catalog', () => {
    findPokemonByKey.mockReturnValue(null);

    const { container } = render(
      <TradePopup
        item={baseItem}
        navigateToUserCatalog={navigateToUserCatalog}
        findPokemonByKey={findPokemonByKey}
      />,
    );

    fireEvent.click(container.querySelector('.trade-popup-content') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(navigateToUserCatalog).toHaveBeenCalledWith('misty', 'inst-2', 'Trade');
  });
});

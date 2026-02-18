import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import WantedListView from '@/pages/Search/views/ListViewComponents/WantedListView';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/pages/Search/views/ListViewComponents/MiniMap', () => ({
  default: () => <div data-testid="mini-map" />,
}));

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: () => <div data-testid="move-display" />,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ gender }: { gender?: string }) => (
    <span data-testid="gender">{gender}</span>
  ),
}));

vi.mock('@/components/pokemonComponents/CP', () => ({
  default: ({ cp }: { cp: number }) => <div data-testid="cp">CP:{cp}</div>,
}));

vi.mock('@/components/pokemonComponents/FriendshipLevel', () => ({
  default: ({ level }: { level: number }) => (
    <div data-testid="friendship-level">FL:{level}</div>
  ),
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
  distance: 2.51,
  latitude: 10,
  longitude: 20,
  cp: 1200,
  pref_lucky: true,
  gender: 'Male',
  friendship_level: 3,
  height: 1.2,
  date_caught: '2026-02-10T12:00:00.000Z',
  trade_list: {
    'variant-1:abc': { match: true, dynamax: true },
  },
  pokemonInfo: { moves: [] },
};

describe('WantedListView', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders trade list entries from findPokemonByKey', () => {
    const findPokemonByKey = vi.fn(() => ({
      currentImage: '/images/variant-1.png',
      name: 'Bulbasaur',
      form: null,
    }));

    render(<WantedListView item={baseItem} findPokemonByKey={findPokemonByKey} />);

    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    expect(screen.getByText('Distance: 2.51 km')).toBeInTheDocument();
    expect(screen.getByTestId('cp')).toHaveTextContent('CP:1200');
    expect(screen.getByTestId('friendship-level')).toHaveTextContent('FL:3');
    const bulbasaurImages = screen.getAllByAltText('Bulbasaur');
    expect(bulbasaurImages).toHaveLength(2);
    expect(
      bulbasaurImages.some((img) =>
        img.className.includes('trade-pokemon-image'),
      ),
    ).toBe(true);
    expect(findPokemonByKey).toHaveBeenCalledWith(
      'variant-1:abc',
      baseItem.trade_list['variant-1:abc'],
    );
  });

  it('navigates to wanted catalog on confirmation Yes', () => {
    const findPokemonByKey = vi.fn(() => null);
    const { container } = render(
      <WantedListView item={baseItem} findPokemonByKey={findPokemonByKey} />,
    );

    fireEvent.click(container.querySelector('.center-column') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(navigateMock).toHaveBeenCalledWith('/pokemon/ash', {
      state: { instanceId: 'inst-1', instanceData: 'Wanted' },
    });
  });

  it('closes confirmation on No without navigating', () => {
    const findPokemonByKey = vi.fn(() => null);
    const { container } = render(
      <WantedListView item={baseItem} findPokemonByKey={findPokemonByKey} />,
    );

    fireEvent.click(container.querySelector('.center-column') as Element);
    expect(
      screen.getByText(/Would you like to see ash's Bulbasaur in their catalog/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(
      screen.queryByText(/Would you like to see ash's Bulbasaur in their catalog/i),
    ).not.toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('opens confirmation from keyboard activation on center column', () => {
    const findPokemonByKey = vi.fn(() => null);
    render(<WantedListView item={baseItem} findPokemonByKey={findPokemonByKey} />);
    const centerColumn = screen.getByRole('button');
    fireEvent.keyDown(centerColumn, { key: 'Enter' });
    expect(
      screen.getByText(/Would you like to see ash's Bulbasaur in their catalog/i),
    ).toBeInTheDocument();
  });

  it('shows Unknown date when date_caught is invalid instead of crashing', () => {
    const findPokemonByKey = vi.fn(() => null);
    render(
      <WantedListView
        item={{ ...baseItem, date_caught: 'invalid-date', location_caught: 'Seattle' }}
        findPokemonByKey={findPokemonByKey}
      />,
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import WantedListView from '@/pages/Search/views/ListViewComponents/WantedListView';

const navigateMock = vi.fn();
vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useNavigate: () => navigateMock,
}));
vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({ default: () => <div /> }));
vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ gender }: { gender?: string }) => <span data-testid="gender">{gender}</span>,
}));
vi.mock('@/components/pokemonComponents/CP', () => ({
  default: ({ cp }: { cp: number }) => <div data-testid="cp">CP:{cp}</div>,
}));
vi.mock('@/components/pokemonComponents/FriendshipLevel', () => ({
  default: ({ level }: { level: number }) => <div data-testid="friendship-level">FL:{level}</div>,
}));
vi.mock('@/pages/Search/utils/URLSelect', () => ({ URLSelect: () => '/images/mock.png' }));
vi.mock('@/pages/Search/utils/getPokemonDisplayName', () => ({ default: () => 'Bulbasaur' }));

const baseItem = {
  username: 'ash', instance_id: 'inst-1', distance: 2.51, cp: 1200,
  pref_lucky: true, gender: 'Male', friendship_level: 3, height: 1.2,
  date_caught: '2026-02-10T12:00:00.000Z',
  trade_list: { 'variant-1:abc': { match: true, dynamax: true } },
  pokemonInfo: { moves: [] },
};

describe('WantedListView', () => {
  beforeEach(() => navigateMock.mockReset());

  it('renders linked offers and explicit discovery actions', () => {
    const findPokemonByKey = vi.fn(() => ({
      currentImage: '/images/variant-1.png', name: 'Bulbasaur', form: null,
    }));
    render(<WantedListView item={baseItem} findPokemonByKey={findPokemonByKey} />);
    expect(screen.getByText('2.5 km away')).toBeInTheDocument();
    expect(screen.getByTestId('cp')).toHaveTextContent('CP:1200');
    expect(screen.getByTestId('friendship-level')).toHaveTextContent('FL:3');
    expect(screen.getAllByAltText('Bulbasaur')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Find trade' })).toBeInTheDocument();
  });

  it('routes catalog and trade actions directly', () => {
    render(<WantedListView item={baseItem} findPokemonByKey={vi.fn(() => null)} />);
    fireEvent.click(screen.getByRole('button', { name: 'View Bulbasaur' }));
    expect(navigateMock).toHaveBeenCalledWith('/pokemon/ash', {
      state: { instanceId: 'inst-1', instanceData: 'Wanted' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find trade' }));
    expect(navigateMock).toHaveBeenCalledWith('/trades?section=matches&candidate_instance_id=inst-1');
  });

  it('shows Unknown date when date_caught is invalid instead of crashing', () => {
    render(<WantedListView item={{ ...baseItem, date_caught: 'invalid-date', location_caught: 'Seattle' }} findPokemonByKey={vi.fn(() => null)} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

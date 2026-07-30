import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CaughtListView from '@/pages/Search/views/ListViewComponents/CaughtListView';

const navigateMock = vi.fn();
vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useNavigate: () => navigateMock,
}));
vi.mock('@/components/pokemonComponents/CP', () => ({
  default: ({ cp }: { cp: number }) => <div data-testid="cp">CP:{cp}</div>,
}));
vi.mock('@/components/pokemonComponents/IV', () => ({ default: () => <div data-testid="ivs" /> }));
vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({ default: () => <div data-testid="move-display" /> }));
vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ gender }: { gender?: string }) => <span data-testid="gender">{gender}</span>,
}));
vi.mock('@/pages/Search/utils/URLSelect', () => ({ URLSelect: () => '/images/mock.png' }));
vi.mock('@/pages/Search/utils/getPokemonDisplayName', () => ({ default: () => 'Bulbasaur' }));

const baseItem = {
  username: 'ash', instance_id: 'inst-1', distance: 1.234, cp: 1500,
  lucky: true, dynamax: true, gender: 'Male', weight: 12.3, height: 1.1,
  fast_move_id: 1, charged_move1_id: 2, charged_move2_id: 3,
  attack_iv: 15, defense_iv: 14, stamina_iv: 13,
  location_caught: 'Seattle', date_caught: '2026-02-10T12:00:00.000Z',
  pokemonInfo: { moves: [] },
};

describe('CaughtListView', () => {
  beforeEach(() => navigateMock.mockReset());

  it('renders a compact result with explicit actions and no embedded map', () => {
    const { container } = render(<CaughtListView item={baseItem} />);
    expect(screen.getByText('1.2 km away')).toBeInTheDocument();
    expect(container.querySelector('.left-column')).not.toBeInTheDocument();
    expect(screen.getByTestId('cp')).toHaveTextContent('CP:1500');
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByTestId('gender')).toHaveTextContent('Male');
    expect(screen.getByRole('button', { name: 'View profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Bulbasaur' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Find trade' })).not.toBeInTheDocument();
  });

  it('navigates directly to the catalog without a confirmation overlay', () => {
    render(<CaughtListView item={baseItem} />);
    fireEvent.click(screen.getByRole('button', { name: 'View Bulbasaur' }));
    expect(navigateMock).toHaveBeenCalledWith('/pokemon/ash', {
      state: { instanceId: 'inst-1', instanceData: 'Caught' },
    });
  });

  it('shows Unknown when date is invalid instead of crashing', () => {
    render(<CaughtListView item={{ ...baseItem, date_caught: 'invalid-date' }} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

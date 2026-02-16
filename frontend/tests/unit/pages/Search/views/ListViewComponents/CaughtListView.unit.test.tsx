import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CaughtListView from '@/pages/Search/views/ListViewComponents/CaughtListView';

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

vi.mock('@/components/pokemonComponents/CP.jsx', () => ({
  default: ({ cp }: { cp: number }) => <div data-testid="cp">CP:{cp}</div>,
}));

vi.mock('@/pages/Search/views/ListViewComponents/MiniMap', () => ({
  default: () => <div data-testid="mini-map" />,
}));

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: () => <div data-testid="ivs" />,
}));

vi.mock('@/components/pokemonComponents/MoveDisplay.jsx', () => ({
  default: () => <div data-testid="move-display" />,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ gender }: { gender?: string }) => <span data-testid="gender">{gender}</span>,
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
  distance: 1.234,
  latitude: 10,
  longitude: 20,
  cp: 1500,
  lucky: true,
  dynamax: true,
  gigantamax: false,
  gender: 'Male',
  weight: 12.3,
  height: 1.1,
  fast_move_id: 1,
  charged_move1_id: 2,
  charged_move2_id: 3,
  attack_iv: 15,
  defense_iv: 14,
  stamina_iv: 13,
  location_caught: 'Seattle',
  date_caught: '2026-02-10T12:00:00.000Z',
  pokemonInfo: { moves: [] },
};

describe('CaughtListView', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders key caught details', () => {
    render(<CaughtListView item={baseItem} />);

    expect(screen.getByText('Distance: 1.23 km')).toBeInTheDocument();
    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    expect(screen.getByTestId('cp')).toHaveTextContent('CP:1500');
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByTestId('gender')).toHaveTextContent('Male');
    expect(screen.getByTestId('move-display')).toBeInTheDocument();
    expect(screen.getByTestId('ivs')).toBeInTheDocument();
    expect(screen.getByText(/Location Caught:/)).toBeInTheDocument();
    expect(screen.getByText('Seattle')).toBeInTheDocument();
    expect(screen.getByText(/Date Caught:/)).toBeInTheDocument();
    expect(screen.getByText('2026-02-10')).toBeInTheDocument();
  });

  it('opens confirmation from center click and closes on No', () => {
    const { container } = render(<CaughtListView item={baseItem} />);

    fireEvent.click(container.querySelector('.left-column') as Element);
    expect(
      screen.queryByText(/Would you like to see ash's Bulbasaur in their catalog/i),
    ).not.toBeInTheDocument();

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

  it('navigates to user catalog when confirmation is accepted', () => {
    const { container } = render(<CaughtListView item={baseItem} />);

    fireEvent.click(container.querySelector('.center-column') as Element);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

    expect(navigateMock).toHaveBeenCalledWith('/pokemon/ash', {
      state: { instanceId: 'inst-1', instanceData: 'Caught' },
    });
  });
});

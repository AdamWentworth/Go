import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import CancelledTradeView from '@/pages/Trades/views/CancelledTradeView';

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">loading...</div>,
}));

vi.mock('@/components/pokemonComponents/MoveDisplay', () => ({
  default: () => <div data-testid="move-display">moves</div>,
}));

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: () => <div data-testid="iv-display">ivs</div>,
}));

vi.mock('@/components/pokemonComponents/FriendshipLevel', () => ({
  default: ({ level }: { level: number }) => <div data-testid="friendship-level">{level}</div>,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: ({ gender }: { gender: string }) => <div data-testid="gender">{gender}</div>,
}));

const baseTrade = {
  trade_id: 't1',
  username_proposed: 'ash',
  username_accepting: 'misty',
  trade_friendship_level: 'Great',
  trade_dust_cost: 12000,
  trade_cancelled_date: '2026-02-10T00:00:00.000Z',
  trade_cancelled_by: 'misty',
  is_lucky_trade: false,
};

const baseDetails = {
  name: 'Mewtwo',
  currentImage: '/images/mewtwo.png',
  type_1_icon: '/images/types/psychic.png',
};

describe('CancelledTradeView', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'ash' }));
  });

  it('renders cancellation metadata and invokes re-propose action', () => {
    const handleRePropose = vi.fn();

    render(
      <CancelledTradeView
        trade={baseTrade}
        currentUserDetails={baseDetails}
        partnerDetails={{ ...baseDetails, name: 'Pikachu' }}
        loading={false}
        handleRePropose={handleRePropose}
      />,
    );

    expect(screen.getByText('Trade Cancelled')).toBeInTheDocument();
    expect(screen.getByText(/Cancelled on:/i)).toBeInTheDocument();
    expect(screen.getByText(/By: misty/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Re-Propose Trade' }));
    expect(handleRePropose).toHaveBeenCalledTimes(1);
  });

  it('renders loading state when details are unavailable', () => {
    render(
      <CancelledTradeView
        trade={baseTrade}
        currentUserDetails={null}
        partnerDetails={null}
        loading={true}
        handleRePropose={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId('loading-spinner')).toHaveLength(2);
  });

  it('shows no-details fallback after details panel is expanded', () => {
    render(
      <CancelledTradeView
        trade={baseTrade}
        currentUserDetails={baseDetails}
        partnerDetails={baseDetails}
        loading={false}
        handleRePropose={vi.fn()}
      />,
    );

    expect(screen.queryByText('No additional details available.')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Show Details' })[0]);
    expect(screen.getByText('No additional details available.')).toBeInTheDocument();
  });
});

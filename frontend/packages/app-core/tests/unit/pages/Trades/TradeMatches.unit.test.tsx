import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TradeMatches from '@/pages/Trades/components/TradeMatches';

const mocks = vi.hoisted(() => ({
  getTradeMatches: vi.fn(),
  proposeTrade: vi.fn(),
  alert: vi.fn().mockResolvedValue(undefined),
  params: new URLSearchParams('source_type=trade&source_instance_id=mine'),
}));

vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useSearchParams: () => [mocks.params, vi.fn()],
}));
vi.mock('@/services/searchService', () => ({
  getTradeMatches: (...args: unknown[]) => mocks.getTradeMatches(...args),
}));
vi.mock('@/features/trades/store/useTradeStore', () => ({
  useTradeStore: (selector: (state: { proposeTrade: typeof mocks.proposeTrade }) => unknown) =>
    selector({ proposeTrade: mocks.proposeTrade }),
}));
vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ alert: mocks.alert }),
}));

const match = {
  match_id: 'mine:wanted:theirs:their-wanted',
  my_offer: {
    instance_id: 'mine', variant_id: '25-default', pokemon_id: 25, nickname: 'Sparky',
    cp: 500, shiny: false, lucky: false, shadow: false, dynamax: false, gigantamax: false,
  },
  my_wanted: {
    instance_id: 'wanted', pokemon_id: 150, shiny: false, lucky: false,
    shadow: false, dynamax: false, gigantamax: false,
  },
  their_offer: {
    instance_id: 'theirs', variant_id: '150-default', pokemon_id: 150,
    cp: 3000, shiny: false, lucky: false, shadow: false, dynamax: false, gigantamax: false,
  },
  their_wanted: {
    instance_id: 'their-wanted', pokemon_id: 25, shiny: false, lucky: false,
    shadow: false, dynamax: false, gigantamax: false,
  },
  trainer: { user_id: 'u2', username: 'misty', is_friend: true, friendship_level: 3 },
  match_reasons: ['Matches Pikachu', 'Matches Mewtwo'],
  is_special_trade: false,
  is_registered_trade: true,
  eligibility: { can_propose: true, blockers: [] },
};

describe('TradeMatches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTradeMatches.mockResolvedValue({ matches: [match] });
    mocks.proposeTrade.mockResolvedValue({ success: true, tradeId: 'trade-1' });
  });

  it('loads contextual reciprocal matches and submits through the authoritative store command', async () => {
    render(<TradeMatches variants={[]} />);
    expect(await screen.findByText('misty')).toBeInTheDocument();
    expect(mocks.getTradeMatches).toHaveBeenCalledWith(expect.objectContaining({
      source_type: 'trade',
      source_instance_id: 'mine',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Propose trade' }));
    expect(screen.getByRole('dialog', { name: 'Review your trade' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send proposal' }));

    await waitFor(() => expect(mocks.proposeTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        username_accepting: 'misty',
        pokemon_instance_id_user_proposed: 'mine',
        pokemon_instance_id_user_accepting: 'theirs',
      }),
    ));
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Trade proposal sent.'));
  });

  it('renders a retryable error instead of an empty success state', async () => {
    mocks.getTradeMatches.mockRejectedValueOnce(new Error('offline'));
    render(<TradeMatches variants={[]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mocks.getTradeMatches).toHaveBeenCalledTimes(2));
  });
});

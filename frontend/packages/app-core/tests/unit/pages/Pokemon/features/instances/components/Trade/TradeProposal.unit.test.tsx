import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TradeProposal from '@/pages/Pokemon/features/instances/components/Trade/TradeProposal';
import type {
  MatchedInstancePokemon,
  TradeProposalPayload,
} from '@/pages/Pokemon/features/instances/components/Trade/tradeTargetsHelpers';

const mocks = vi.hoisted(() => ({
  proposeTrade: vi.fn(),
  alert: vi.fn(),
  getStoredUsername: vi.fn(),
  useCalculateStardustCost: vi.fn(),
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('@/features/trades/store/useTradeStore', () => ({
  useTradeStore: (
    selector: (state: { proposeTrade: typeof mocks.proposeTrade }) => unknown,
  ) => selector({ proposeTrade: mocks.proposeTrade }),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    alert: mocks.alert,
  }),
}));

vi.mock('@/utils/storage', () => ({
  getStoredUsername: mocks.getStoredUsername,
}));

vi.mock('@/utils/logger', () => ({
  createScopedLogger: () => mocks.logger,
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useCalculateStardustCost', () => ({
  default: (...args: unknown[]) => mocks.useCalculateStardustCost(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Wanted/FriendshipManager', () => ({
  default: ({
    friendship_level,
    pref_lucky,
  }: {
    friendship_level: number;
    pref_lucky: boolean;
  }) => (
    <div>
      friendship-{friendship_level}
      {pref_lucky ? '-lucky' : ''}
    </div>
  ),
}));

vi.mock('@/components/pokemonComponents/CP', () => ({
  default: ({ cp }: { cp: string | number | null }) => <div>cp-{String(cp ?? '')}</div>,
}));

vi.mock('@/components/pokemonComponents/Moves', () => ({
  default: () => <div>moves</div>,
}));

vi.mock('@/components/pokemonComponents/LocationCaught', () => ({
  default: () => <div>location-caught</div>,
}));

vi.mock('@/components/pokemonComponents/DateCaught', () => ({
  default: () => <div>date-caught</div>,
}));

const makePokemon = (
  name: string,
  instanceId: string,
  overrides: Record<string, unknown> = {},
): MatchedInstancePokemon =>
  ({
    name,
    variant_id: `${instanceId}-variant`,
    variantType: 'default',
    currentImage: `/images/${name}.png`,
    instanceData: {
      instance_id: instanceId,
      nickname: `${name} Nick`,
      cp: 1234,
      shadow: false,
      purified: false,
    },
    ...overrides,
  }) as unknown as MatchedInstancePokemon;

describe('TradeProposal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a proposal using the selected matched instance', async () => {
    mocks.proposeTrade.mockResolvedValue({ success: true, tradeId: 'trade-1' });
    mocks.alert.mockResolvedValue(undefined);
    mocks.getStoredUsername.mockReturnValue('proposer');
    mocks.useCalculateStardustCost.mockReturnValue({
      stardustCost: 800,
      isSpecialTrade: true,
      isRegisteredTrade: false,
    });
    const onClose = vi.fn();
    const wanted = makePokemon('Gengar', 'wanted-1', { variant_id: 'gengar-variant' });
    const matchedOne = makePokemon('Haunter', 'matched-1');
    const matchedTwo = makePokemon('Gastly', 'matched-2');

    render(
      <TradeProposal
        passedInPokemon={wanted}
        clickedPokemon={{ matchedInstances: [matchedOne, matchedTwo] } as TradeProposalPayload}
        wantedPokemon={{ friendship_level: 3, pref_lucky: true }}
        onClose={onClose}
        myInstances={{}}
        instances={{}}
        username="acceptor"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Propose Trade' })).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText('Choose the instance to trade:'), {
      target: { value: 'matched-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Propose Trade' }));

    await waitFor(() => {
      expect(mocks.proposeTrade).toHaveBeenCalledTimes(1);
    });

    expect(mocks.proposeTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        username_proposed: 'proposer',
        username_accepting: 'acceptor',
        pokemon_instance_id_user_proposed: 'matched-2',
        pokemon_instance_id_user_accepting: 'wanted-1',
        is_special_trade: true,
        is_registered_trade: false,
        is_lucky_trade: true,
        trade_dust_cost: 800,
        trade_friendship_level: 3,
      }),
    );
    expect(mocks.alert).toHaveBeenCalledWith('Trade proposal successfully created!');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

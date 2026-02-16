import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import OwnershipSearch from '@/pages/Search/SearchParameters/OwnershipSearch';

const caughtMock = vi.fn();
const tradeMock = vi.fn();
const wantedMock = vi.fn();

vi.mock('@/pages/Search/SearchParameters/OwnershipComponents/CaughtSearch', () => ({
  default: (props: unknown) => {
    caughtMock(props);
    return <div data-testid="caught-search" />;
  },
}));

vi.mock('@/pages/Search/SearchParameters/OwnershipComponents/TradeSearch', () => ({
  default: (props: unknown) => {
    tradeMock(props);
    return <div data-testid="trade-search" />;
  },
}));

vi.mock('@/pages/Search/SearchParameters/OwnershipComponents/WantedSearch', () => ({
  default: (props: unknown) => {
    wantedMock(props);
    return <div data-testid="wanted-search" />;
  },
}));

type Props = React.ComponentProps<typeof OwnershipSearch>;

const createProps = (overrides: Partial<Props> = {}): Props => ({
  ownershipMode: 'caught',
  setOwnershipMode: vi.fn(),
  ivs: { Attack: 1, Defense: 2, Stamina: 3 },
  setIvs: vi.fn(),
  isHundo: true,
  setIsHundo: vi.fn(),
  onlyMatchingTrades: true,
  setOnlyMatchingTrades: vi.fn(),
  prefLucky: true,
  setPrefLucky: vi.fn(),
  alreadyRegistered: true,
  setAlreadyRegistered: vi.fn(),
  trade_in_wanted_list: true,
  setTradeInWantedList: vi.fn(),
  friendshipLevel: 4,
  setFriendshipLevel: vi.fn(),
  ...overrides,
});

describe('OwnershipSearch', () => {
  it('renders component matching active ownership mode', () => {
    const { rerender } = render(<OwnershipSearch {...createProps({ ownershipMode: 'caught' })} />);
    expect(screen.getByTestId('caught-search')).toBeInTheDocument();

    rerender(<OwnershipSearch {...createProps({ ownershipMode: 'trade' })} />);
    expect(screen.getByTestId('trade-search')).toBeInTheDocument();

    rerender(<OwnershipSearch {...createProps({ ownershipMode: 'wanted' })} />);
    expect(screen.getByTestId('wanted-search')).toBeInTheDocument();
  });

  it('resets non-active mode filters via effects', async () => {
    const setIvs = vi.fn();
    const setIsHundo = vi.fn();
    const setOnlyMatchingTrades = vi.fn();
    const setPrefLucky = vi.fn();
    const setAlreadyRegistered = vi.fn();
    const setTradeInWantedList = vi.fn();
    const setFriendshipLevel = vi.fn();

    render(
      <OwnershipSearch
        {...createProps({
          ownershipMode: 'trade',
          setIvs,
          setIsHundo,
          setOnlyMatchingTrades,
          setPrefLucky,
          setAlreadyRegistered,
          setTradeInWantedList,
          setFriendshipLevel,
        })}
      />,
    );

    await waitFor(() => {
      expect(setIvs).toHaveBeenCalledWith({ Attack: null, Defense: null, Stamina: null });
      expect(setIsHundo).toHaveBeenCalledWith(false);
      expect(setPrefLucky).toHaveBeenCalledWith(false);
      expect(setAlreadyRegistered).toHaveBeenCalledWith(false);
      expect(setTradeInWantedList).toHaveBeenCalledWith(false);
      expect(setFriendshipLevel).toHaveBeenCalledWith(0);
    });

    expect(setOnlyMatchingTrades).not.toHaveBeenCalledWith(false);
  });

  it('dispatches canonical mode values when option buttons are clicked', () => {
    const setOwnershipMode = vi.fn();

    render(
      <OwnershipSearch
        {...createProps({ ownershipMode: 'caught', setOwnershipMode })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trade' }));
    fireEvent.click(screen.getByRole('button', { name: 'Wanted' }));

    expect(setOwnershipMode).toHaveBeenNthCalledWith(1, 'trade');
    expect(setOwnershipMode).toHaveBeenNthCalledWith(2, 'wanted');
  });

  it('normalizes legacy trade_in_wanted_list prop into WantedSearch prop', () => {
    render(
      <OwnershipSearch
        {...createProps({ ownershipMode: 'wanted', trade_in_wanted_list: true })}
      />,
    );

    const latestCall = wantedMock.mock.calls.at(-1)?.[0] as {
      tradeInWantedList?: boolean;
    };

    expect(latestCall?.tradeInWantedList).toBe(true);
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import SearchSecondaryPanels from '@/pages/Search/SearchSecondaryPanels';

vi.mock('@/pages/Search/SearchParameters/LocationSearch', () => ({
  default: () => <div data-testid="location-search-panel" />,
}));

vi.mock('@/pages/Search/SearchParameters/OwnershipSearch', () => ({
  default: () => <div data-testid="ownership-search-panel" />,
}));

const toSetter = <T,>() => vi.fn() as unknown as React.Dispatch<React.SetStateAction<T>>;

const locationProps: React.ComponentProps<typeof SearchSecondaryPanels>['locationProps'] = {
  city: 'Seattle',
  setCity: toSetter<string>(),
  useCurrentLocation: false,
  setUseCurrentLocation: toSetter<boolean>(),
  setCoordinates: toSetter<{ latitude: number | null; longitude: number | null }>(),
  range: 5,
  setRange: toSetter<number>(),
  resultsLimit: 10,
  setResultsLimit: toSetter<number>(),
  handleSearch: vi.fn(),
  isLoading: false,
  view: 'list',
  setView: toSetter<'list' | 'map'>(),
  setSelectedBoundary: toSetter<string | null>(),
};

const ownershipProps: React.ComponentProps<typeof SearchSecondaryPanels>['ownershipProps'] = {
  ownershipMode: 'caught',
  setOwnershipMode: toSetter<'caught' | 'trade' | 'wanted'>(),
  ivs: { Attack: null, Defense: null, Stamina: null },
  setIvs: toSetter<{ Attack: number | '' | null; Defense: number | '' | null; Stamina: number | '' | null }>(),
  isHundo: false,
  setIsHundo: toSetter<boolean>(),
  onlyMatchingTrades: false,
  setOnlyMatchingTrades: toSetter<boolean>(),
  prefLucky: false,
  setPrefLucky: toSetter<boolean>(),
  alreadyRegistered: false,
  setAlreadyRegistered: toSetter<boolean>(),
  trade_in_wanted_list: false,
  setTradeInWantedList: toSetter<boolean>(),
  friendshipLevel: 0,
  setFriendshipLevel: toSetter<number>(),
};

describe('SearchSecondaryPanels', () => {
  it('renders grouped row wrapper on mid-width layouts', () => {
    const { container } = render(
      <SearchSecondaryPanels
        isMidWidth
        locationProps={locationProps}
        ownershipProps={ownershipProps}
      />,
    );

    expect(screen.getByTestId('location-search-panel')).toBeInTheDocument();
    expect(screen.getByTestId('ownership-search-panel')).toBeInTheDocument();
    expect(container.querySelector('.location-ownership-row')).not.toBeNull();
  });

  it('renders ungrouped panels on wide/narrow non-mid layouts', () => {
    const { container } = render(
      <SearchSecondaryPanels
        isMidWidth={false}
        locationProps={locationProps}
        ownershipProps={ownershipProps}
      />,
    );

    expect(screen.getByTestId('location-search-panel')).toBeInTheDocument();
    expect(screen.getByTestId('ownership-search-panel')).toBeInTheDocument();
    expect(container.querySelector('.location-ownership-row')).toBeNull();
  });
});

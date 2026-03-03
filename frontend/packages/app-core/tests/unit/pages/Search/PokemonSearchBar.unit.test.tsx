import React, { useEffect } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PokemonSearchBar, {
  type PokemonSearchQueryParams,
} from '@/pages/Search/PokemonSearchBar';
import type { SearchOwnershipMode } from '@/pages/Search/utils/ownershipMode';
import type { PokemonVariant } from '@/types/pokemonVariants';

type SearchView = 'list' | 'map';

type MockConfig = {
  pokemon: string;
  isShiny: boolean;
  isShadow: boolean;
  costume: string;
  selectedForm: string;
  selectedMoves: {
    fastMove: number | string | null;
    chargedMove1: number | string | null;
    chargedMove2: number | string | null;
  };
  selectedGender: string;
  selectedBackgroundId: number | null;
  dynamax: boolean;
  gigantamax: boolean;
  city: string;
  useCurrentLocation: boolean;
  coordinates: {
    latitude: number | null;
    longitude: number | null;
  };
  range: number;
  resultsLimit: number;
  ownershipMode: SearchOwnershipMode;
  ivs: {
    Attack: number | null;
    Defense: number | null;
    Stamina: number | null;
  };
  isHundo: boolean;
  onlyMatchingTrades: boolean;
  prefLucky: boolean;
  alreadyRegistered: boolean;
  tradeInWantedList: boolean;
  friendshipLevel: number;
};

const defaultMockConfig: MockConfig = {
  pokemon: 'Bulbasaur',
  isShiny: false,
  isShadow: false,
  costume: '',
  selectedForm: '',
  selectedMoves: {
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  },
  selectedGender: 'Any',
  selectedBackgroundId: null,
  dynamax: false,
  gigantamax: false,
  city: 'Seattle, WA, USA',
  useCurrentLocation: false,
  coordinates: {
    latitude: 47.6062,
    longitude: -122.3321,
  },
  range: 5,
  resultsLimit: 10,
  ownershipMode: 'caught',
  ivs: {
    Attack: 15,
    Defense: 14,
    Stamina: 13,
  },
  isHundo: false,
  onlyMatchingTrades: false,
  prefLucky: false,
  alreadyRegistered: false,
  tradeInWantedList: false,
  friendshipLevel: 0,
};

let mockConfig: MockConfig = { ...defaultMockConfig };

vi.mock('@/pages/Search/SearchParameters/VariantSearch', () => ({
  default: ({
    setPokemon,
    setIsShiny,
    setIsShadow,
    setCostume,
    setSelectedForm,
    setSelectedMoves,
    setSelectedGender,
    setSelectedBackgroundId,
    setDynamax,
    setGigantamax,
  }: {
    setPokemon: (value: string) => void;
    setIsShiny: (value: boolean) => void;
    setIsShadow: (value: boolean) => void;
    setCostume: (value: string) => void;
    setSelectedForm: (value: string) => void;
    setSelectedMoves: (value: MockConfig['selectedMoves']) => void;
    setSelectedGender: (value: string) => void;
    setSelectedBackgroundId: (value: number | null) => void;
    setDynamax: (value: boolean) => void;
    setGigantamax: (value: boolean) => void;
  }) => {
    useEffect(() => {
      setPokemon(mockConfig.pokemon);
      setIsShiny(mockConfig.isShiny);
      setIsShadow(mockConfig.isShadow);
      setCostume(mockConfig.costume);
      setSelectedForm(mockConfig.selectedForm);
      setSelectedMoves(mockConfig.selectedMoves);
      setSelectedGender(mockConfig.selectedGender);
      setSelectedBackgroundId(mockConfig.selectedBackgroundId);
      setDynamax(mockConfig.dynamax);
      setGigantamax(mockConfig.gigantamax);
    }, [
      setPokemon,
      setIsShiny,
      setIsShadow,
      setCostume,
      setSelectedForm,
      setSelectedMoves,
      setSelectedGender,
      setSelectedBackgroundId,
      setDynamax,
      setGigantamax,
    ]);

    return <div data-testid="variant-search" />;
  },
}));

vi.mock('@/pages/Search/SearchParameters/OwnershipSearch', () => ({
  default: ({
    setOwnershipMode,
    setIvs,
    setIsHundo,
    setOnlyMatchingTrades,
    setPrefLucky,
    setAlreadyRegistered,
    setTradeInWantedList,
    setFriendshipLevel,
  }: {
    setOwnershipMode: (value: SearchOwnershipMode) => void;
    setIvs: (value: MockConfig['ivs']) => void;
    setIsHundo: (value: boolean) => void;
    setOnlyMatchingTrades: (value: boolean) => void;
    setPrefLucky: (value: boolean) => void;
    setAlreadyRegistered: (value: boolean) => void;
    setTradeInWantedList: (value: boolean) => void;
    setFriendshipLevel: (value: number) => void;
  }) => {
    useEffect(() => {
      setOwnershipMode(mockConfig.ownershipMode);
      setIvs(mockConfig.ivs);
      setIsHundo(mockConfig.isHundo);
      setOnlyMatchingTrades(mockConfig.onlyMatchingTrades);
      setPrefLucky(mockConfig.prefLucky);
      setAlreadyRegistered(mockConfig.alreadyRegistered);
      setTradeInWantedList(mockConfig.tradeInWantedList);
      setFriendshipLevel(mockConfig.friendshipLevel);
    }, [
      setOwnershipMode,
      setIvs,
      setIsHundo,
      setOnlyMatchingTrades,
      setPrefLucky,
      setAlreadyRegistered,
      setTradeInWantedList,
      setFriendshipLevel,
    ]);

    return <div data-testid="ownership-search" />;
  },
}));

vi.mock('@/pages/Search/SearchParameters/LocationSearch', () => ({
  default: ({
    setCity,
    setUseCurrentLocation,
    setCoordinates,
    setRange,
    setResultsLimit,
    handleSearch,
  }: {
    setCity: (value: string) => void;
    setUseCurrentLocation: (value: boolean) => void;
    setCoordinates: (value: MockConfig['coordinates']) => void;
    setRange: (value: number) => void;
    setResultsLimit: (value: number) => void;
    handleSearch: () => Promise<void>;
  }) => {
    useEffect(() => {
      setCity(mockConfig.city);
      setUseCurrentLocation(mockConfig.useCurrentLocation);
      setCoordinates(mockConfig.coordinates);
      setRange(mockConfig.range);
      setResultsLimit(mockConfig.resultsLimit);
    }, [setCity, setUseCurrentLocation, setCoordinates, setRange, setResultsLimit]);

    return (
      <button type="button" onClick={handleSearch}>
        trigger-search
      </button>
    );
  },
}));

const onSearchMock = vi.fn<
  (
    queryParams: PokemonSearchQueryParams,
    boundaryWKT?: string | null,
  ) => Promise<void>
>().mockResolvedValue(undefined);

const setViewMock = vi.fn<(nextValue: React.SetStateAction<SearchView>) => void>();
const setIsCollapsedMock = vi.fn<
  (nextValue: React.SetStateAction<boolean>) => void
>();

const pokemonCache = [
  {
    pokemon_id: 1,
    name: 'Bulbasaur',
    form: null,
    costumes: [{ name: 'Party', costume_id: 7 }],
    max: [],
  },
] as unknown as PokemonVariant[];

describe('PokemonSearchBar', () => {
  beforeAll(() => {
    vi.stubGlobal('scrollTo', vi.fn());
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {
          return undefined;
        }

        disconnect() {
          return undefined;
        }

        unobserve() {
          return undefined;
        }
      },
    );
  });

  beforeEach(() => {
    mockConfig = {
      ...defaultMockConfig,
      selectedMoves: { ...defaultMockConfig.selectedMoves },
      coordinates: { ...defaultMockConfig.coordinates },
      ivs: { ...defaultMockConfig.ivs },
    };
    onSearchMock.mockClear();
    setViewMock.mockClear();
    setIsCollapsedMock.mockClear();
  });

  it('blocks shadow trade/wanted queries before dispatching search', async () => {
    mockConfig.ownershipMode = 'trade';
    mockConfig.isShadow = true;

    render(
      <PokemonSearchBar
        onSearch={onSearchMock}
        isLoading={false}
        view="list"
        setView={setViewMock}
        isCollapsed={false}
        setIsCollapsed={setIsCollapsedMock}
        pokemonCache={pokemonCache}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'trigger-search' }));

    expect(onSearchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Shadow Pokemon cannot be listed for trade or wanted'),
    ).toBeInTheDocument();
  });

  it('builds trade query params with caught-only and wanted-only fields normalized', async () => {
    mockConfig.ownershipMode = 'trade';
    mockConfig.costume = 'Party';
    mockConfig.selectedGender = 'Female';
    mockConfig.selectedBackgroundId = 42;
    mockConfig.selectedMoves = {
      fastMove: 1,
      chargedMove1: 2,
      chargedMove2: 3,
    };
    mockConfig.onlyMatchingTrades = true;
    mockConfig.ivs = {
      Attack: 15,
      Defense: 14,
      Stamina: 13,
    };
    mockConfig.prefLucky = true;
    mockConfig.alreadyRegistered = true;
    mockConfig.tradeInWantedList = true;
    mockConfig.friendshipLevel = 4;

    render(
      <PokemonSearchBar
        onSearch={onSearchMock}
        isLoading={false}
        view="list"
        setView={setViewMock}
        isCollapsed={false}
        setIsCollapsed={setIsCollapsedMock}
        pokemonCache={pokemonCache}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'trigger-search' }));

    await waitFor(() => {
      expect(onSearchMock).toHaveBeenCalledTimes(1);
    });

    const [queryParams, boundaryWKT] = onSearchMock.mock.calls[0];

    expect(boundaryWKT).toBeNull();
    expect(queryParams).toMatchObject({
      pokemon_id: 1,
      shiny: false,
      shadow: false,
      costume_id: 7,
      fast_move_id: 1,
      charged_move_1_id: 2,
      charged_move_2_id: 3,
      gender: 'Female',
      background_id: 42,
      ownership: 'trade',
      only_matching_trades: true,
      attack_iv: null,
      defense_iv: null,
      stamina_iv: null,
      pref_lucky: null,
      friendship_level: null,
      already_registered: null,
      trade_in_wanted_list: null,
      range_km: 5,
      limit: 10,
    });
    expect(setIsCollapsedMock).toHaveBeenCalledWith(true);
  });

  it('uses list/map controls with canonical view keys', () => {
    render(
      <PokemonSearchBar
        onSearch={onSearchMock}
        isLoading={false}
        view="list"
        setView={setViewMock}
        isCollapsed={false}
        setIsCollapsed={setIsCollapsedMock}
        pokemonCache={pokemonCache}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    fireEvent.click(screen.getByRole('button', { name: 'Map view' }));

    expect(setViewMock).toHaveBeenNthCalledWith(1, 'list');
    expect(setViewMock).toHaveBeenNthCalledWith(2, 'map');
  });
});

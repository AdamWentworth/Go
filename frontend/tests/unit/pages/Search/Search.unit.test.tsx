import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Search from '@/pages/Search/Search';

const mockedSearchPokemon = vi.fn();
const alertMock = vi.fn().mockResolvedValue(undefined);

const variantsState = {
  variants: [{ pokemon_id: 1, name: 'Bulbasaur' }],
  pokedexLists: {
    default: [{ pokemon_id: 1, name: 'Bulbasaur' }],
  },
};

vi.mock('@/services/searchService', () => ({
  searchPokemon: (...args: unknown[]) => mockedSearchPokemon(...args),
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof variantsState) => unknown) =>
    selector(variantsState),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    alert: alertMock,
  }),
}));

vi.mock('@/pages/Search/SearchModeToggle', () => ({
  default: ({
    setSearchMode,
    isWelcome,
  }: {
    setSearchMode: (mode: 'pokemon' | 'trainer') => void;
    isWelcome?: boolean;
  }) => (
    <div data-testid={isWelcome ? 'search-toggle-welcome' : 'search-toggle-active'}>
      <button onClick={() => setSearchMode('pokemon')}>mode-pokemon</button>
      <button onClick={() => setSearchMode('trainer')}>mode-trainer</button>
    </div>
  ),
}));

vi.mock('@/pages/Search/PokemonSearchBar', () => ({
  default: ({
    onSearch,
    setView,
  }: {
    onSearch: (query: Record<string, string>, boundary: string) => Promise<void>;
    setView: (view: 'list' | 'map') => void;
  }) => (
    <div data-testid="pokemon-search-bar">
      <button
        onClick={() => onSearch({ ownership: 'owned' }, 'BOUNDARY-WKT')}
      >
        search-owned
      </button>
      <button
        onClick={() => onSearch({ ownership: 'trade' }, 'BOUNDARY-WKT')}
      >
        search-trade
      </button>
      <button onClick={() => setView('map')}>switch-map</button>
      <button onClick={() => setView('list')}>switch-list</button>
    </div>
  ),
}));

vi.mock('@/pages/Search/TrainerSearchBar', () => ({
  default: () => <div data-testid="trainer-search-bar" />,
}));

vi.mock('@/pages/Search/views/ListView', () => ({
  default: ({
    data,
    instanceData,
    hasSearched,
  }: {
    data: Array<{ username?: string }>;
    instanceData: string;
    hasSearched: boolean;
  }) => (
    <div data-testid="list-view">
      {`${instanceData}|${data.length}|${data[0]?.username ?? ''}|${hasSearched}`}
    </div>
  ),
}));

vi.mock('@/pages/Search/views/MapView', () => ({
  default: ({
    data,
    instanceData,
  }: {
    data: Array<{ username?: string }>;
    instanceData: string;
  }) => <div data-testid="map-view">{`${instanceData}|${data.length}`}</div>,
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock('@/components/ActionMenu', () => ({
  default: () => <div data-testid="action-menu" />,
}));

describe('Search', () => {
  beforeEach(() => {
    mockedSearchPokemon.mockReset();
    alertMock.mockClear();
  });

  it('renders welcome state before selecting search mode', () => {
    render(<Search />);

    expect(screen.getByTestId('search-toggle-welcome')).toBeInTheDocument();
    expect(screen.getByText('Which type of search would you like?')).toBeInTheDocument();
  });

  it('normalizes owned -> caught and renders sorted/enriched list results', async () => {
    mockedSearchPokemon.mockResolvedValueOnce([
      { pokemon_id: 1, distance: 5, username: 'far' },
      { pokemon_id: 1, distance: 2, username: 'near' },
      { pokemon_id: 999, distance: 1, username: 'ignored' },
    ]);

    render(<Search />);

    fireEvent.click(screen.getByText('mode-pokemon'));
    fireEvent.click(screen.getByText('search-owned'));

    await waitFor(() => {
      expect(screen.getByTestId('list-view')).toHaveTextContent('caught|2|near|true');
    });

    expect(mockedSearchPokemon).toHaveBeenCalledWith(
      expect.objectContaining({ ownership: 'owned' }),
    );
  });

  it('switches to map view and passes trade ownership mode', async () => {
    mockedSearchPokemon.mockResolvedValueOnce([
      { pokemon_id: 1, distance: 3, username: 'ash' },
    ]);

    render(<Search />);

    fireEvent.click(screen.getByText('mode-pokemon'));
    fireEvent.click(screen.getByText('search-trade'));

    await waitFor(() => {
      expect(screen.getByTestId('list-view')).toHaveTextContent('trade|1|ash|true');
    });

    fireEvent.click(screen.getByText('switch-map'));

    await waitFor(() => {
      expect(screen.getByTestId('map-view')).toHaveTextContent('trade|1');
    });
  });
});

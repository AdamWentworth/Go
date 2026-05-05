import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AppLoadingProvider } from '@/contexts/AppLoadingContext';
import PokemonMenu from '@/pages/Pokemon/components/Menus/PokemonMenu/PokemonMenu';

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ alert: () => undefined }),
}));

const makeProps = (
  overrides: Partial<React.ComponentProps<typeof PokemonMenu>> = {},
): React.ComponentProps<typeof PokemonMenu> => ({
  isEditable: true,
  sortedPokemons: [],
  allPokemons: [],
  loading: false,
  selectedPokemon: null,
  setSelectedPokemon: vi.fn(),
  isFastSelectEnabled: false,
  toggleCardHighlight: vi.fn(),
  highlightedCards: new Set(),
  tagFilter: '',
  lists: {},
  instances: {},
  sortType: 'number',
  setSortType: vi.fn(),
  sortMode: 'ascending',
  setSortMode: vi.fn(),
  variants: [],
  username: 'ash',
  setIsFastSelectEnabled: vi.fn(),
  searchTerm: '',
  setSearchTerm: vi.fn(),
  showEvolutionaryLine: false,
  toggleEvolutionaryLine: vi.fn(),
  activeView: 'pokemon',
  ...overrides,
});

describe('PokemonMenu', () => {
  it('uses the shared loading spinner for its loading fallback', () => {
    render(
      <AppLoadingProvider>
        <PokemonMenu {...makeProps({ loading: true })} />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

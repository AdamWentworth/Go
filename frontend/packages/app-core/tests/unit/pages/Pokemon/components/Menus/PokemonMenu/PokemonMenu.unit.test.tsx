import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLoadingProvider } from '@/contexts/AppLoadingContext';
import PokemonMenu from '@/pages/Pokemon/components/Menus/PokemonMenu/PokemonMenu';

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ alert: () => undefined, confirm: confirmMock }),
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
  onClearTagFilter: vi.fn(),
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
  beforeEach(() => {
    confirmMock.mockClear();
    confirmMock.mockResolvedValue(true);
  });

  it('uses the shared loading spinner for its loading fallback', () => {
    render(
      <AppLoadingProvider>
        <PokemonMenu {...makeProps({ loading: true })} />
      </AppLoadingProvider>,
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('shows an active tag filter chip and confirms before clearing it', async () => {
    const onClearTagFilter = vi.fn();

    render(
      <AppLoadingProvider>
        <PokemonMenu
          {...makeProps({
            tagFilter: 'Caught',
            onClearTagFilter,
          })}
        />
      </AppLoadingProvider>,
    );

    expect(screen.getByText('Caught').closest('.active-tag-filter-row')).toHaveClass(
      'active-tag-filter-caught',
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /clear caught tag filter/i,
      }),
    );

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining('Clear the Caught tag?'),
      );
      expect(onClearTagFilter).toHaveBeenCalledTimes(1);
    });
  });

  it('uses the favorite star icon for the Favorites tag chip', () => {
    render(
      <AppLoadingProvider>
        <PokemonMenu
          {...makeProps({
            tagFilter: 'Favorites',
          })}
        />
      </AppLoadingProvider>,
    );

    const chip = screen.getByText('Favorites').closest('.active-tag-filter-row');
    expect(chip).toHaveClass('active-tag-filter-favorites');
    expect(chip).toHaveClass('active-tag-filter-with-icon');
    expect(chip?.querySelector('.active-tag-filter-icon')).toHaveAttribute(
      'src',
      '/images/fav_pressed.png',
    );
  });
});

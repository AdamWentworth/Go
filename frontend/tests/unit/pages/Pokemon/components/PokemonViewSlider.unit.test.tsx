import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PokemonViewSlider from '@/pages/Pokemon/components/PokemonViewSlider';
import type { PokemonOverlaySelection } from '@/pages/Pokemon/hooks/useInstanceIdProcessor';
import type { Instances } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { TagBuckets } from '@/types/tags';
import type { SortMode, SortType } from '@/types/sort';
import type { PokedexLists } from '@/types/pokedex';

type PokedexMenuMockProps = {
  setTagFilter?: (value: string) => void;
  setHighlightedCards?: (cards: Set<number | string>) => void;
  setActiveView?: (value: string) => void;
  onListSelect?: (list: PokemonVariant[], key: string) => void;
};

vi.mock('@/pages/Pokemon/components/Menus/PokedexMenu/PokedexListsMenu', () => ({
  default: ({
    setTagFilter,
    setHighlightedCards,
    setActiveView,
    onListSelect,
  }: PokedexMenuMockProps) => (
    <button
      data-testid="pokedex-menu-trigger"
      onClick={() => {
        setTagFilter?.('Caught');
        setHighlightedCards?.(new Set(['inst-1']));
        setActiveView?.('pokemon');
        onListSelect?.(
          [{ variant_id: '0001-default' } as PokemonVariant],
          'default',
        );
      }}
    >
      Pokedex Menu
    </button>
  ),
}));

vi.mock('@/pages/Pokemon/components/Menus/PokemonMenu/PokemonMenu', () => ({
  default: ({ activeView }: { activeView: string }) => (
    <div data-testid="pokemon-menu">{activeView}</div>
  ),
}));

vi.mock('@/pages/Pokemon/components/Menus/TagsMenu/TagsMenu', () => ({
  default: ({ onSelectTag }: { onSelectTag: (filter: string) => void }) => (
    <button
      data-testid="tags-menu-trigger"
      onClick={() => onSelectTag('Trade')}
    >
      Tags Menu
    </button>
  ),
}));

const toSetter = <T,>() => vi.fn() as unknown as React.Dispatch<React.SetStateAction<T>>;

type Props = React.ComponentProps<typeof PokemonViewSlider>;

const makeProps = (overrides: Partial<Props> = {}): Props => {
  const variants = [{ variant_id: '0001-default' } as PokemonVariant];

  return {
    containerRef: React.createRef<HTMLDivElement>(),
    swipeHandlers: {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
    },
    transform: 'translate3d(-100%,0,0)',
    isDragging: false,
    setTagFilter: toSetter<string>(),
    onPokedexHighlightedCardsChange: vi.fn(),
    onPokedexActiveViewChange: vi.fn(),
    onPokedexListSelect: vi.fn(),
    pokedexLists: { default: variants } as PokedexLists,
    variants,
    isEditable: true,
    sortedPokemons: variants,
    loading: false,
    selectedPokemon: null as PokemonOverlaySelection,
    setSelectedPokemon: vi.fn(),
    isFastSelectEnabled: false,
    toggleCardHighlight: vi.fn(),
    highlightedCards: new Set<string>(),
    tagFilter: '',
    activeTags: {} as TagBuckets,
    instances: {} as Instances,
    sortType: 'number' as SortType,
    setSortType: toSetter<SortType>(),
    sortMode: 'ascending' as SortMode,
    setSortMode: toSetter<SortMode>(),
    username: 'ash',
    setIsFastSelectEnabled: toSetter<boolean>(),
    searchTerm: '',
    setSearchTerm: toSetter<string>(),
    showEvolutionaryLine: false,
    toggleEvolutionaryLine: vi.fn(),
    activeView: 'pokemon',
    onTagSelect: vi.fn(),
    ...overrides,
  };
};

describe('PokemonViewSlider', () => {
  it('renders slider with transform and transition styles', () => {
    const { rerender } = render(<PokemonViewSlider {...makeProps()} />);

    const slider = document.querySelector('.view-slider') as HTMLDivElement | null;
    expect(slider).not.toBeNull();
    expect(slider?.style.transform).toBe('translate3d(-100%,0,0)');
    expect(slider?.style.transition).toContain('transform 0.3s');

    rerender(<PokemonViewSlider {...makeProps({ isDragging: true })} />);
    const draggingSlider = document.querySelector('.view-slider') as HTMLDivElement | null;
    expect(draggingSlider?.style.transition).toBe('none');
  });

  it('wires pokedex panel callbacks to parent handlers', () => {
    const setTagFilter = toSetter<string>();
    const onPokedexHighlightedCardsChange = vi.fn();
    const onPokedexActiveViewChange = vi.fn();
    const onPokedexListSelect = vi.fn();

    render(
      <PokemonViewSlider
        {...makeProps({
          setTagFilter,
          onPokedexHighlightedCardsChange,
          onPokedexActiveViewChange,
          onPokedexListSelect,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId('pokedex-menu-trigger'));

    expect(setTagFilter).toHaveBeenCalledWith('Caught');
    expect(onPokedexHighlightedCardsChange).toHaveBeenCalledWith(new Set(['inst-1']));
    expect(onPokedexActiveViewChange).toHaveBeenCalledWith('pokemon');
    expect(onPokedexListSelect).toHaveBeenCalledWith(
      [{ variant_id: '0001-default' }],
      'default',
    );
  });

  it('forwards tag selection from tags panel', () => {
    const onTagSelect = vi.fn();
    render(<PokemonViewSlider {...makeProps({ onTagSelect })} />);

    fireEvent.click(screen.getByTestId('tags-menu-trigger'));
    expect(onTagSelect).toHaveBeenCalledWith('Trade');
  });
});

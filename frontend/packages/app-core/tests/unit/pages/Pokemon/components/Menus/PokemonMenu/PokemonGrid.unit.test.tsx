import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PokemonGrid from '@/pages/Pokemon/components/Menus/PokemonMenu/PokemonGrid';

vi.mock('@/contexts/AppLoadingContext', () => ({
  AppLoadingFallback: ({ source }: { source: string }) => (
    <div data-testid="grid-loading-source" data-source={source} />
  ),
}));

vi.mock('@/pages/Pokemon/components/Menus/PokemonMenu/PokemonCard', () => ({
  default: ({ pokemon }: { pokemon: { name: string } }) => (
    <div data-testid="pokemon-card">{pokemon.name}</div>
  ),
}));

type GridPokemon = NonNullable<
  React.ComponentProps<typeof PokemonGrid>['sortedPokemons'][number]
>;

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const height = target.classList.contains('pokemon-grid-row') ? 180 : 600;
    this.callback(
      [
        {
          target,
          contentRect: { height },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }

  unobserve() {}

  disconnect() {}
}

const makePokemon = (index: number) =>
  ({
    pokemon_id: index,
    pokedex_number: index,
    name: `Pokemon ${index}`,
    variant_id: `pokemon-${index}`,
    currentImage: `/images/${index}.png`,
  }) as GridPokemon;

const GridHarness = ({
  activeView = 'pokemon',
  pokemons,
}: {
  activeView?: string;
  pokemons: GridPokemon[];
}) => {
  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={gridContainerRef}>
      <PokemonGrid
        sortedPokemons={pokemons}
        highlightedCards={new Set()}
        handleSelect={vi.fn()}
        tagFilter=""
        sortType="number"
        isEditable={true}
        toggleCardHighlight={vi.fn()}
        setIsFastSelectEnabled={vi.fn()}
        isFastSelectEnabled={false}
        variants={pokemons}
        gridContainerRef={gridContainerRef as React.RefObject<HTMLDivElement>}
        activeView={activeView}
      />
    </div>
  );
};

const makePokemons = (count = 12) =>
  Array.from({ length: count }, (_, index) => makePokemon(index + 1));

const renderGrid = (count = 12) => {
  const pokemons = makePokemons(count);

  return render(<GridHarness pokemons={pokemons} />);
};

describe('PokemonGrid', () => {
  let getBoundingClientRectSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });

    getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getBoundingClientRectMock(this: HTMLElement) {
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: this.classList.contains('pokemon-grid-row') ? 180 : 0,
          width: 0,
          height: this.classList.contains('pokemon-grid-row') ? 180 : 0,
          toJSON: () => ({}),
        };
      });
  });

  afterEach(() => {
    getBoundingClientRectSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('keeps the layout loader active until measured rows are ready to reveal', () => {
    const { container } = renderGrid();

    expect(screen.getByTestId('grid-loading-source')).toHaveAttribute(
      'data-source',
      'pokemon-grid-layout',
    );
    expect(container.querySelector('.pokemon-grid-cell.visible')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(49);
    });
    expect(screen.getByTestId('grid-loading-source')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.queryByTestId('grid-loading-source')).not.toBeInTheDocument();
    expect(container.querySelector('.pokemon-grid-cell.visible')).toBeInTheDocument();
  });

  it('positions virtual rows from the measured first-row height before reveal', () => {
    const { container } = renderGrid();

    const rows = container.querySelectorAll<HTMLElement>('.pokemon-grid-row');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveStyle({ top: '188px' });
  });

  it('does not restart the layout loader when switching slider views', () => {
    const pokemons = makePokemons();
    const { rerender } = render(<GridHarness activeView="pokemon" pokemons={pokemons} />);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.queryByTestId('grid-loading-source')).not.toBeInTheDocument();

    rerender(<GridHarness activeView="pokedex" pokemons={pokemons} />);
    expect(screen.queryByTestId('grid-loading-source')).not.toBeInTheDocument();

    rerender(<GridHarness activeView="tags" pokemons={pokemons} />);
    expect(screen.queryByTestId('grid-loading-source')).not.toBeInTheDocument();

    rerender(<GridHarness activeView="pokemon" pokemons={pokemons} />);
    expect(screen.queryByTestId('grid-loading-source')).not.toBeInTheDocument();
  });
});

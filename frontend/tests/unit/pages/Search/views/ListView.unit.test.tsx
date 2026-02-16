import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import ListView from '@/pages/Search/views/ListView';
import type { PokemonVariant } from '@/types/pokemonVariants';

vi.mock('@/pages/Search/views/ListViewComponents/OwnedListView', () => ({
  default: ({ item }: { item: { instance_id?: string } }) => (
    <div data-testid="owned-item">{item.instance_id}</div>
  ),
}));

vi.mock('@/pages/Search/views/ListViewComponents/TradeListView', () => ({
  default: ({
    item,
    findPokemonByKey,
  }: {
    item: { instance_id?: string; variant_id?: string };
    findPokemonByKey: (
      keyOrInstanceId?: string | null,
      instanceLike?: Record<string, unknown>,
    ) => PokemonVariant | null;
  }) => {
    const variant = findPokemonByKey(item.variant_id ?? null, {
      variant_id: item.variant_id ?? null,
      pokemon_id: 1,
    });
    return (
      <div data-testid="trade-item">
        {item.instance_id}:{variant?.variant_id ?? 'none'}
      </div>
    );
  },
}));

vi.mock('@/pages/Search/views/ListViewComponents/WantedListView', () => ({
  default: ({
    item,
    findPokemonByKey,
  }: {
    item: { instance_id?: string; pokemon_id?: number };
    findPokemonByKey: (
      keyOrInstanceId?: string | null,
      instanceLike?: Record<string, unknown>,
    ) => PokemonVariant | null;
  }) => {
    const variant = findPokemonByKey(null, {
      pokemon_id: item.pokemon_id ?? null,
    });
    return (
      <div data-testid="wanted-item">
        {item.instance_id}:{variant?.variant_id ?? 'none'}
      </div>
    );
  },
}));

const variants = [
  {
    variant_id: 'variant-1',
    pokemon_id: 1,
    variantType: 'default',
    currentImage: '/images/default.png',
    species_name: 'bulbasaur',
  },
] as unknown as PokemonVariant[];

describe('ListView', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scrollToSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders pre-search empty state when no results and hasSearched is false', () => {
    render(
      <ListView
        data={[]}
        instanceData="owned"
        hasSearched={false}
        pokemonCache={variants}
        scrollToTopTrigger={0}
      />,
    );

    expect(
      screen.getByText(/Use the Toolbar above to Discover Pokemon near you/i),
    ).toBeInTheDocument();
  });

  it('renders post-search empty state when no results and hasSearched is true', () => {
    render(
      <ListView
        data={[]}
        instanceData="owned"
        hasSearched
        pokemonCache={variants}
        scrollToTopTrigger={0}
      />,
    );

    expect(
      screen.getByText(/No Pokemon found matching your criteria/i),
    ).toBeInTheDocument();
  });

  it('renders mode-specific list items and resolves variants for trade/wanted', () => {
    const data = [
      { instance_id: 'inst-1', variant_id: 'variant-1', pokemon_id: 1 },
      { instance_id: 'inst-2', variant_id: 'variant-1', pokemon_id: 1 },
    ];

    const owned = render(
      <ListView
        data={data}
        instanceData="owned"
        hasSearched
        pokemonCache={variants}
        scrollToTopTrigger={0}
      />,
    );
    expect(owned.getAllByTestId('owned-item')).toHaveLength(2);
    owned.unmount();

    const trade = render(
      <ListView
        data={data}
        instanceData="trade"
        hasSearched
        pokemonCache={variants}
        scrollToTopTrigger={0}
      />,
    );
    expect(trade.getAllByTestId('trade-item')[0]).toHaveTextContent(
      'inst-1:variant-1',
    );
    trade.unmount();

    const wanted = render(
      <ListView
        data={data}
        instanceData="wanted"
        hasSearched
        pokemonCache={variants}
        scrollToTopTrigger={1}
      />,
    );
    expect(wanted.getAllByTestId('wanted-item')[0]).toHaveTextContent(
      'inst-1:variant-1',
    );

    expect(scrollToSpy).toHaveBeenCalled();
  });
});

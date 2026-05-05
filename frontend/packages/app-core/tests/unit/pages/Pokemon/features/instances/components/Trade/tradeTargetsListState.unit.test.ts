import { describe, expect, it } from 'vitest';

import {
  filterVisibleTradeTargetEntries,
  resolveTradeTargetContainerClass,
  resolveTradeTargetDisplayName,
  resolveTradeTargetPokedexLabel,
  toTradeTargetDisplayItems,
  type TradeTargetEntry,
  type TradeTargetDisplayItem,
} from '@/pages/Pokemon/features/instances/components/Trade/tradeTargetsListState';

const entries: Array<[string, TradeTargetEntry]> = [
  [
    'one',
    {
      name: 'Bulbasaur',
      currentImage: '/images/bulbasaur.png',
      pokedex_number: 1,
    },
  ],
  [
    'two',
    {
      name: 'Ivysaur',
      image_url_shiny: '/images/ivysaur-shiny.png',
    },
  ],
];

describe('tradeTargetsListState', () => {
  it('filters entries by edit mode, not-wanted state, and mirror key', () => {
    expect(
      filterVisibleTradeTargetEntries([...entries], { one: true }, false, false, null).map(
        ([key]) => key,
      ),
    ).toEqual(['two']);

    expect(
      filterVisibleTradeTargetEntries([...entries], { one: true }, true, false, null).map(
        ([key]) => key,
      ),
    ).toEqual(['one', 'two']);

    expect(
      filterVisibleTradeTargetEntries([...entries], {}, true, true, 'two').map(([key]) => key),
    ).toEqual(['two']);
  });

  it('normalizes entries for display and image fallback behavior', () => {
    expect(toTradeTargetDisplayItems([...entries], '/images/fallback.png')).toEqual([
      {
        key: 'one',
        name: 'Bulbasaur',
        species_name: 'Bulbasaur',
        pokedex_number: 1,
        currentImage: '/images/bulbasaur.png',
        image_url: '/images/bulbasaur.png',
        image_url_shiny: '/images/bulbasaur.png',
        pokemon_id: undefined,
      },
      {
        key: 'two',
        name: 'Ivysaur',
        species_name: 'Ivysaur',
        pokedex_number: undefined,
        currentImage: '/images/fallback.png',
        image_url: '/images/fallback.png',
        image_url_shiny: '/images/ivysaur-shiny.png',
        pokemon_id: undefined,
      },
    ]);
  });

  it('resolves grid sizing class names', () => {
    expect(resolveTradeTargetContainerClass(true, 1)).toBe('single-item-list');
    expect(resolveTradeTargetContainerClass(false, 31)).toBe('xxlarge-list');
    expect(resolveTradeTargetContainerClass(false, 16)).toBe('xlarge-list');
    expect(resolveTradeTargetContainerClass(false, 10)).toBe('large-list');
    expect(resolveTradeTargetContainerClass(false, 9)).toBe('');
  });

  it('resolves display name and pokedex label', () => {
    const item = {
      key: 'giratina',
      name: 'Giratina',
      species_name: 'Giratina',
      form: 'Origin',
      pokedex_number: 487,
    } as TradeTargetDisplayItem;

    expect(resolveTradeTargetDisplayName(item)).toBe('Origin Giratina');
    expect(resolveTradeTargetPokedexLabel(item)).toBe('#487');
    expect(resolveTradeTargetDisplayName({ key: 'missing', species_name: '' })).toBe('');
    expect(resolveTradeTargetPokedexLabel({ key: 'missing', species_name: '' })).toBeNull();
  });
});

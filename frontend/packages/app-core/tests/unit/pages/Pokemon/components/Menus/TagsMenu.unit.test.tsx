import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import TagsMenu from '@/pages/Pokemon/components/Menus/TagsMenu/TagsMenu';
import type { TagBuckets, TagItem } from '@/types/tags';

vi.mock('@/pages/Pokemon/components/Menus/TagsMenu/hooks/useDownloadImage', () => ({
  default: () => ({ isDownloading: false, downloadImage: vi.fn() }),
}));

const makeItem = (overrides: Partial<TagItem>): TagItem =>
  ({
    instance_id: 'instance',
    pokemon_id: 1,
    pokedex_number: 1,
    currentImage: '/images/default/pokemon_1.png',
    friendship_level: null,
    mirror: false,
    pref_lucky: false,
    cp: null,
    hp: 0,
    favorite: false,
    most_wanted: false,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    gender: 'unknown',
    registered: false,
    moves: [],
    shiny: false,
    ...overrides,
  }) as TagItem;

describe('TagsMenu', () => {
  it('derives Trade from caught and Most Wanted from wanted only', () => {
    const activeTags: TagBuckets = {
      caught: {
        c1: makeItem({
          instance_id: 'c1',
          favorite: true,
          is_caught: true,
          is_for_trade: true,
        }),
      },
      wanted: {
        w1: makeItem({
          instance_id: 'w1',
          is_wanted: true,
          most_wanted: true,
          // Should NOT leak into Trade, because Trade is derived from caught bucket only.
          is_for_trade: true,
        }),
      },
    };

    const { container } = render(
      <TagsMenu onSelectTag={vi.fn()} activeTags={activeTags} variants={[]} />,
    );

    const favoritesTag = container.querySelector('[data-tag="Favorites"]');
    const tradeTag = container.querySelector('[data-tag="Trade"]');
    const caughtTag = container.querySelector('[data-tag="Caught"]');
    const wantedTag = container.querySelector('[data-tag="Wanted"]');
    const mostWantedTag = container.querySelector('[data-tag="Most Wanted"]');

    expect(favoritesTag?.textContent).toContain('1');
    expect(tradeTag?.textContent).toContain('1');
    expect(caughtTag?.textContent).toContain('1');
    expect(wantedTag?.textContent).toContain('1');
    expect(mostWantedTag?.textContent).toContain('1');
  });

  it('calls onSelectTag when a tag tile is clicked', () => {
    const onSelectTag = vi.fn();
    const activeTags: TagBuckets = {
      caught: {
        c1: makeItem({ instance_id: 'c1', is_caught: true }),
      },
      wanted: {},
    };

    const { container } = render(
      <TagsMenu onSelectTag={onSelectTag} activeTags={activeTags} variants={[]} />,
    );

    const caughtTag = container.querySelector('[data-tag="Caught"]');
    expect(caughtTag).toBeTruthy();

    fireEvent.click(caughtTag as Element);
    expect(onSelectTag).toHaveBeenCalledWith('Caught');
  });

  it('caps preview rendering to 18 sprites per tag for large datasets', () => {
    const caught: Record<string, TagItem> = {};
    const wanted: Record<string, TagItem> = {};

    for (let i = 1; i <= 120; i += 1) {
      const id = `c-${i}`;
      caught[id] = makeItem({
        instance_id: id,
        pokemon_id: i,
        is_caught: true,
        favorite: i % 2 === 0,
        is_for_trade: i % 3 === 0,
      });
    }

    for (let i = 1; i <= 90; i += 1) {
      const id = `w-${i}`;
      wanted[id] = makeItem({
        instance_id: id,
        pokemon_id: 500 + i,
        is_wanted: true,
        most_wanted: i % 2 === 1,
      });
    }

    const activeTags: TagBuckets = { caught, wanted };

    const { container } = render(
      <TagsMenu onSelectTag={vi.fn()} activeTags={activeTags} variants={[]} />,
    );

    const caughtTag = container.querySelector('[data-tag="Caught"]');
    const wantedTag = container.querySelector('[data-tag="Wanted"]');
    const favoritesTag = container.querySelector('[data-tag="Favorites"]');
    const tradeTag = container.querySelector('[data-tag="Trade"]');
    const mostWantedTag = container.querySelector('[data-tag="Most Wanted"]');

    expect(caughtTag?.textContent).toContain('120');
    expect(wantedTag?.textContent).toContain('90');
    expect(favoritesTag?.textContent).toContain('60');
    expect(tradeTag?.textContent).toContain('40');
    expect(mostWantedTag?.textContent).toContain('45');

    expect(caughtTag?.querySelectorAll('.tag-sprite').length).toBe(18);
    expect(wantedTag?.querySelectorAll('.tag-sprite').length).toBe(18);
    expect(favoritesTag?.querySelectorAll('.tag-sprite').length).toBe(18);
    expect(tradeTag?.querySelectorAll('.tag-sprite').length).toBe(18);
    expect(mostWantedTag?.querySelectorAll('.tag-sprite').length).toBe(18);
  });
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import TagsMenu from '@/pages/Pokemon/components/Menus/TagsMenu/TagsMenu';
import type { TagBuckets, TagItem } from '@/types/tags';

vi.mock('@/pages/Pokemon/components/Menus/TagsMenu/hooks/useDownloadImage', () => ({
  default: () => ({ isDownloading: false, downloadImage: vi.fn() }),
}));

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({ confirm: confirmMock }),
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
  beforeEach(() => {
    confirmMock.mockClear();
    confirmMock.mockResolvedValue(true);
  });

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

  it('can focus the inventory side without rendering wishlist tags', () => {
    const activeTags: TagBuckets = {
      caught: {
        c1: makeItem({ instance_id: 'c1', is_caught: true, is_for_trade: true }),
      },
      wanted: {
        w1: makeItem({ instance_id: 'w1', is_wanted: true, most_wanted: true }),
      },
    };

    const { container } = render(
      <TagsMenu
        panel="inventory"
        onSelectTag={vi.fn()}
        activeTags={activeTags}
        variants={[]}
      />,
    );

    expect(container.querySelector('[data-tag="Caught"]')).toBeTruthy();
    expect(container.querySelector('[data-tag="Trade"]')).toBeTruthy();
    expect(container.querySelector('[data-tag="Wanted"]')).toBeNull();
    expect(container.querySelector('[data-tag="Most Wanted"]')).toBeNull();
  });

  it('can focus the wishlist side without rendering inventory tags', () => {
    const activeTags: TagBuckets = {
      caught: {
        c1: makeItem({ instance_id: 'c1', is_caught: true, is_for_trade: true }),
      },
      wanted: {
        w1: makeItem({ instance_id: 'w1', is_wanted: true, most_wanted: true }),
      },
    };

    const { container } = render(
      <TagsMenu
        panel="wishlist"
        onSelectTag={vi.fn()}
        activeTags={activeTags}
        variants={[]}
      />,
    );

    expect(container.querySelector('[data-tag="Wanted"]')).toBeTruthy();
    expect(container.querySelector('[data-tag="Most Wanted"]')).toBeTruthy();
    expect(container.querySelector('[data-tag="Caught"]')).toBeNull();
    expect(container.querySelector('[data-tag="Trade"]')).toBeNull();
  });

  it('shows a sticky active tag filter escape hatch in focused side panels', async () => {
    const onClearTagFilter = vi.fn();

    render(
      <TagsMenu
        panel="wishlist"
        onSelectTag={vi.fn()}
        activeTags={{ caught: {}, wanted: {} }}
        variants={[]}
        tagFilter="Wanted"
        onClearTagFilter={onClearTagFilter}
      />,
    );

    const clearButton = screen.getByRole('button', { name: /clear wanted tag filter/i });
    const chip = clearButton.closest('.active-tag-filter-row');
    expect(chip).toHaveClass('active-tag-filter-placement-panel');
    expect(chip).toHaveClass('active-tag-filter-wanted');

    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalledWith(expect.stringContaining('Clear the Wanted tag?'));
      expect(onClearTagFilter).toHaveBeenCalledTimes(1);
    });
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

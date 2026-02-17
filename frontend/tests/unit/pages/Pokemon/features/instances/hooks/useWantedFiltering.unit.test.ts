import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import useWantedFiltering from '@/pages/Pokemon/features/instances/hooks/useWantedFiltering';
import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
} from '@/pages/Pokemon/features/instances/utils/constants';

const selectedExclude = (enabledIndex: number | null): boolean[] =>
  EXCLUDE_IMAGES_wanted.map((_, idx) => enabledIndex === idx);

const selectedInclude = (enabledIndex: number | null): boolean[] =>
  INCLUDE_IMAGES_wanted.map((_, idx) => enabledIndex === idx);

describe('useWantedFiltering', () => {
  it('filters out excluded entries in non-edit mode', () => {
    const setLocalNotWantedList = vi.fn();
    const listsState = {
      wanted: {
        comm1: { variantType: 'default', shiny_rarity: 'community_day' },
        normal1: { variantType: 'default', shiny_rarity: 'full_odds' },
      },
    };
    const exclude = selectedExclude(0); // communityDayFilter
    const include = selectedInclude(null);
    const wantedFilters = {};
    const notWantedList = {};

    const { result } = renderHook(() =>
      useWantedFiltering(
        listsState,
        exclude,
        include,
        wantedFilters,
        setLocalNotWantedList as any,
        notWantedList,
        false,
      ),
    );

    expect(result.current.filteredOutPokemon).toContain('comm1');
    expect(result.current.filteredWantedList.comm1).toBeUndefined();
    expect(result.current.filteredWantedList.normal1).toBeDefined();
    expect(setLocalNotWantedList).not.toHaveBeenCalled();
    expect(result.current.updatedLocalWantedFilters.communityDayFilter).toBe(true);
  });

  it('adds greyed-out entries and updates localNotWantedList in edit mode', async () => {
    const setLocalNotWantedList = vi.fn();
    const listsState = {
      wanted: {
        shiny1: { variantType: 'shiny', shiny_rarity: 'community_day' },
        normal1: { variantType: 'default', shiny_rarity: 'full_odds' },
      },
    };
    const exclude = selectedExclude(0); // communityDayFilter
    const include = selectedInclude(null);
    const wantedFilters = {};
    const notWantedList = {};

    const { result } = renderHook(() =>
      useWantedFiltering(
        listsState,
        exclude,
        include,
        wantedFilters,
        setLocalNotWantedList as any,
        notWantedList,
        true,
      ),
    );

    await waitFor(() => {
      expect(setLocalNotWantedList).toHaveBeenCalled();
    });

    expect(result.current.filteredOutPokemon).toContain('shiny1');
    expect(result.current.filteredWantedList.shiny1).toMatchObject({ greyedOut: true });
  });

  it('applies include-only filters as union after excludes', () => {
    const listsState = {
      wanted: {
        regional1: { rarity: 'regional', variantType: 'default', shiny_rarity: 'full_odds' },
        normal1: { rarity: 'common', variantType: 'default', shiny_rarity: 'full_odds' },
      },
    };
    const exclude = selectedExclude(null);
    const include = selectedInclude(3); // regionalIconFilter (include side)
    const wantedFilters = {};
    const notWantedList = {};

    const { result } = renderHook(() =>
      useWantedFiltering(
        listsState,
        exclude,
        include,
        wantedFilters,
        vi.fn() as any,
        notWantedList,
        false,
      ),
    );

    expect(Object.keys(result.current.filteredWantedList)).toEqual(['regional1']);
    expect(result.current.updatedLocalWantedFilters.regionalIconFilter).toBe(true);
  });

  it('does not repeatedly call setLocalNotWantedList when filtered entries are already tracked', async () => {
    const setLocalNotWantedList = vi.fn();
    const listsState = {
      wanted: {
        comm1: { variantType: 'default', shiny_rarity: 'community_day' },
        normal1: { variantType: 'default', shiny_rarity: 'full_odds' },
      },
    };

    const { rerender } = renderHook(
      ({
        selectedExcludeImages,
        selectedIncludeOnlyImages,
        notWantedList,
      }) =>
        useWantedFiltering(
          listsState,
          selectedExcludeImages,
          selectedIncludeOnlyImages,
          {},
          setLocalNotWantedList as any,
          notWantedList,
          true,
        ),
      {
        initialProps: {
          selectedExcludeImages: selectedExclude(0),
          selectedIncludeOnlyImages: selectedInclude(null),
          notWantedList: {},
        },
      },
    );

    await waitFor(() => {
      expect(setLocalNotWantedList).toHaveBeenCalledTimes(1);
    });

    rerender({
      selectedExcludeImages: selectedExclude(0),
      selectedIncludeOnlyImages: selectedInclude(null),
      notWantedList: { comm1: true },
    });

    await waitFor(() => {
      expect(setLocalNotWantedList).toHaveBeenCalledTimes(1);
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import useTradeFiltering from '@/pages/Pokemon/features/instances/hooks/useTradeFiltering';
import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade } from '@/pages/Pokemon/features/instances/utils/constants';

const selectedExclude = (enabledIndex: number | null): boolean[] =>
  EXCLUDE_IMAGES_trade.map((_, idx) => enabledIndex === idx);

const selectedInclude = (enabledIndex: number | null): boolean[] =>
  INCLUDE_IMAGES_trade.map((_, idx) => enabledIndex === idx);

describe('useTradeFiltering', () => {
  it('greys out filtered entries in view mode and marks shiny filter active', async () => {
    const setLocalNotTradeList = vi.fn();

    const { result } = renderHook(() =>
      useTradeFiltering(
        {
          trade: {
            shiny1: { variantType: 'shiny', shiny_rarity: 'community_day' },
            normal1: { variantType: 'default', shiny_rarity: 'community_day' },
          },
        },
        selectedExclude(0), // shinyIconFilter
        selectedInclude(null),
        {},
        setLocalNotTradeList as any,
        {},
        false,
      ),
    );

    await waitFor(() => {
      expect(setLocalNotTradeList).toHaveBeenCalledTimes(1);
    });

    expect(result.current.filteredOutPokemon).toContain('shiny1');
    expect(result.current.filteredTradeList.shiny1).toMatchObject({ greyedOut: true });
    expect(result.current.updatedLocalTradeFilters.shinyIconFilter).toBe(true);
  });

  it('keeps filtered entries removed in edit mode and skips not-trade updates', () => {
    const setLocalNotTradeList = vi.fn();

    const { result } = renderHook(() =>
      useTradeFiltering(
        {
          trade: {
            shiny1: { variantType: 'shiny' },
            normal1: { variantType: 'default' },
          },
        },
        selectedExclude(0), // shinyIconFilter
        selectedInclude(null),
        {},
        setLocalNotTradeList as any,
        {},
        true,
      ),
    );

    expect(result.current.filteredOutPokemon).toContain('shiny1');
    expect(result.current.filteredTradeList.shiny1).toBeUndefined();
    expect(setLocalNotTradeList).not.toHaveBeenCalled();
  });

  it('applies include-only filters as union against current list', () => {
    const { result } = renderHook(() =>
      useTradeFiltering(
        {
          trade: {
            comm1: { variantType: 'default', shiny_rarity: 'community_day' },
            raid1: { variantType: 'default', shiny_rarity: 'raid_day' },
          },
        },
        selectedExclude(null),
        selectedInclude(0), // communityDayFilter
        {},
        vi.fn() as any,
        {},
        true,
      ),
    );

    expect(Object.keys(result.current.filteredTradeList)).toEqual(['comm1']);
    expect(result.current.updatedLocalTradeFilters.communityDayFilter).toBe(true);
  });
});

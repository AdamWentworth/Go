import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCommunityRankings } from '@/pages/Rankings/hooks/useCommunityRankings';

const serviceMocks = vi.hoisted(() => ({
  getRankings: vi.fn(),
}));

vi.mock('@/services/searchService', () => ({
  getPokemonCommunityRankings: serviceMocks.getRankings,
}));

const payload = {
  privacy_threshold: 5,
  snapshot: {
    collector_users: 5,
    wishlist_users: 4,
    updated_at: '2026-07-25T12:00:00Z',
  },
  most_wanted: [],
  rarest: [],
};

describe('useCommunityRankings', () => {
  beforeEach(() => {
    serviceMocks.getRankings.mockReset();
    serviceMocks.getRankings.mockResolvedValue(payload);
  });

  it('does not request private rankings before login', () => {
    const { result } = renderHook(() => useCommunityRankings(false));

    expect(result.current.loading).toBe(false);
    expect(serviceMocks.getRankings).not.toHaveBeenCalled();
  });

  it('loads and can explicitly refresh the snapshot', async () => {
    const { result } = renderHook(() => useCommunityRankings(true));

    await waitFor(() => expect(result.current.data).toEqual(payload));
    expect(serviceMocks.getRankings).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getRankings).toHaveBeenLastCalledWith();

    act(() => result.current.refresh());
    await waitFor(() => expect(serviceMocks.getRankings).toHaveBeenCalledTimes(2));
  });
});

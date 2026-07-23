import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PokemonCatalogManifest,
  PokemonPvPRankingsPayload,
} from '@shared-contracts/pokemon';

const serviceMocks = vi.hoisted(() => ({
  getManifest: vi.fn(),
  getRankings: vi.fn(),
}));

vi.mock('@/services/pokemonDataService', () => ({
  getPokemonCatalogManifest: serviceMocks.getManifest,
  getPokemonPvPDataChunk: serviceMocks.getRankings,
}));

import {
  resetPvPRankingsRequestForTests,
  usePvPRankings,
} from '@/pages/Pvp/hooks/usePvPRankings';

const manifest = {
  schemaVersion: 3,
  catalogVersion: 'catalog-v1',
  generatedAt: '2026-07-23T00:00:00Z',
  chunks: {
    pokemonFull: {
      name: 'pokemonFull',
      endpoint: '/pokemon-full',
      contentType: 'application/json',
      etag: '"catalog-v1"',
      version: 'catalog-v1',
      bytesJson: 1,
      bytesGzip: 1,
    },
  },
} as PokemonCatalogManifest;

const rankings = {
  source: null,
  leagues: {
    great: { key: 'great', label: 'Great League', cpLimit: 1500, entries: [] },
    ultra: { key: 'ultra', label: 'Ultra League', cpLimit: 2500, entries: [] },
    master: { key: 'master', label: 'Master League', cpLimit: null, entries: [] },
  },
} as PokemonPvPRankingsPayload;

describe('usePvPRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPvPRankingsRequestForTests();
    serviceMocks.getManifest.mockResolvedValue(manifest);
    serviceMocks.getRankings.mockResolvedValue(rankings);
  });

  it('loads the manifest before requesting the versioned rankings chunk', async () => {
    const { result } = renderHook(() => usePvPRankings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(rankings);
    expect(serviceMocks.getManifest).toHaveBeenCalledOnce();
    expect(serviceMocks.getRankings).toHaveBeenCalledWith(manifest);
  });

  it('shares one in-flight ranking request between page consumers', async () => {
    const first = renderHook(() => usePvPRankings());
    const second = renderHook(() => usePvPRankings());

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(serviceMocks.getManifest).toHaveBeenCalledOnce();
    expect(serviceMocks.getRankings).toHaveBeenCalledOnce();
  });

  it('reports a stable user-facing error when the API has no published snapshot', async () => {
    serviceMocks.getRankings.mockResolvedValue(null);
    const { result } = renderHook(() => usePvPRankings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('PvP rankings are temporarily unavailable.');
  });
});

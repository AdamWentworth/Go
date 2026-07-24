import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  Move,
  PokemonCatalogManifest,
  PokemonMovesChunk,
} from '@shared-contracts/pokemon';

const serviceMocks = vi.hoisted(() => ({
  getManifest: vi.fn(),
  getMoves: vi.fn(),
}));

vi.mock('@/services/pokemonDataService', () => ({
  getPokemonCatalogManifest: serviceMocks.getManifest,
  getPokemonMovesChunk: serviceMocks.getMoves,
}));

import {
  resetPvPMoveMechanicsRequestForTests,
  usePvPMoveMechanics,
} from '@/pages/Pvp/hooks/usePvPMoveMechanics';

const manifest = {
  schemaVersion: 3,
  catalogVersion: 'catalog-v1',
  generatedAt: '2026-07-24T00:00:00Z',
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

const quickAttack = {
  move_id: 1,
  name: 'Quick Attack',
  type_id: 1,
  raid_power: 1,
  pvp_power: 8,
  raid_energy: 1,
  pvp_energy: 10,
  raid_cooldown: 1,
  pvp_turns: 2,
  is_fast: 1,
  type_name: 'Normal',
  legacy: false,
  type: 'normal',
} as Move;

const moves: PokemonMovesChunk = [{
  pokemon_id: 1,
  moves: [quickAttack],
  fusion: [],
  crownForms: [],
}];

describe('usePvPMoveMechanics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPvPMoveMechanicsRequestForTests();
    serviceMocks.getManifest.mockResolvedValue(manifest);
    serviceMocks.getMoves.mockResolvedValue(moves);
  });

  it('does not fetch the moves chunk until a local battle tool opens', () => {
    const { result } = renderHook(() => usePvPMoveMechanics(false));

    expect(result.current.loading).toBe(false);
    expect(serviceMocks.getManifest).not.toHaveBeenCalled();
    expect(serviceMocks.getMoves).not.toHaveBeenCalled();
  });

  it('loads and indexes the versioned move mechanics chunk', async () => {
    const { result } = renderHook(() => usePvPMoveMechanics(true));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.get('quickattack')).toMatchObject({
      power: 8,
      energyGain: 10,
      turns: 2,
    });
    expect(serviceMocks.getMoves).toHaveBeenCalledWith(manifest);
  });

  it('shares one in-flight mechanics request between battle tools', async () => {
    const first = renderHook(() => usePvPMoveMechanics(true));
    const second = renderHook(() => usePvPMoveMechanics(true));

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(serviceMocks.getManifest).toHaveBeenCalledOnce();
    expect(serviceMocks.getMoves).toHaveBeenCalledOnce();
  });
});

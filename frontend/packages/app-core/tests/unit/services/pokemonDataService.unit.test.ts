import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getPokemonCatalogManifest,
  getPokemonMaxDataChunk,
  getPokemonMovesChunk,
  getPokemonPvPDataChunk,
  getPokemonRaidDataChunk,
  getPokemons,
  simulatePokemonPvPBattle,
} from '@/services/pokemonDataService';
import { normalizeAssetUrlsDeep } from '@/utils/assetUrl';
import type { BasePokemon } from '@/types/pokemonBase';
import type {
  PokemonCatalogManifest,
  PokemonPvPBattleRequest,
  PokemonPvPBattleResponse,
} from '@shared-contracts/pokemon';
import pokemonFixtures from '../../__helpers__/fixtures/pokemons.json' with { type: 'json' };

describe('pokemonDataService', () => {
  const payload = (pokemonFixtures as BasePokemon[]).slice(0, 2);
  const manifest: PokemonCatalogManifest = {
    schemaVersion: 2,
    catalogVersion: 'catalog-v1',
    generatedAt: '2026-07-14T00:00:00Z',
    chunks: {
      pokemonFull: {
        name: 'pokemonFull',
        endpoint: '/catalog/pokemon-full',
        contentType: 'application/json',
        etag: '"catalog-v1"',
        version: 'catalog-v1',
        bytesJson: 123,
        bytesGzip: 45,
      },
      catalog: {
        name: 'catalog',
        endpoint: '/catalog/pokemon-bootstrap',
        contentType: 'application/json',
        etag: '"catalog-bootstrap-v1"',
        version: 'catalog-bootstrap-v1',
        bytesJson: 111,
        bytesGzip: 42,
      },
      moves: {
        name: 'moves',
        endpoint: '/catalog/moves',
        contentType: 'application/json',
        etag: '"moves-v1"',
        version: 'moves-v1',
        bytesJson: 55,
        bytesGzip: 25,
      },
      raidData: {
        name: 'raidData',
        endpoint: '/catalog/raid-data',
        contentType: 'application/json',
        etag: '"raid-v1"',
        version: 'raid-v1',
        bytesJson: 44,
        bytesGzip: 22,
      },
      maxData: {
        name: 'maxData',
        endpoint: '/catalog/max-data',
        contentType: 'application/json',
        etag: '"max-v1"',
        version: 'max-v1',
        bytesJson: 33,
        bytesGzip: 18,
      },
      pvpData: {
        name: 'pvpData',
        endpoint: '/catalog/pvp-data',
        contentType: 'application/json',
        etag: '"pvp-v1"',
        version: 'pvp-v1',
        bytesJson: 30,
        bytesGzip: 16,
      },
    },
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches pokemon data on 200 response', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/pokemons'),
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    );
  });

  it('prefers the manifest catalog chunk endpoint for bootstrap data', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await getPokemons({ manifest });

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/catalog/pokemon-bootstrap'),
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    );
  });

  it('accepts legacy manifest endpoints without duplicating the service path', async () => {
    const legacyManifest: PokemonCatalogManifest = {
      ...manifest,
      chunks: {
        ...manifest.chunks,
        catalog: {
          ...manifest.chunks.catalog!,
          endpoint: '/pokemon/catalog',
        },
      },
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await getPokemons({ manifest: legacyManifest });

    const requestUrl = String(fetchSpy.mock.calls[0]?.[0]);
    expect(requestUrl).toContain('/api/pokemon/catalog');
    expect(requestUrl).not.toContain('/pokemon/pokemon/catalog');
  });

  it('fetches independently versioned moves and raid-data chunks', async () => {
    const moves = [{ pokemon_id: 1, moves: [], fusion: [], crownForms: [] }];
    const raidData = [{ pokemon_id: 1, raid_boss: [] }];
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(moves), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(raidData), { status: 200 }));

    await expect(getPokemonMovesChunk(manifest)).resolves.toEqual(moves);
    await expect(getPokemonRaidDataChunk(manifest)).resolves.toEqual(raidData);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/catalog/moves'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/catalog/raid-data'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetches the self-contained Max Battle catalog chunk', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await expect(getPokemonMaxDataChunk(manifest)).resolves.toEqual(
      normalizeAssetUrlsDeep(payload),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/catalog/max-data'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetches and validates the object-shaped PvP rankings chunk', async () => {
    const pvpData = {
      source: null,
      leagues: {
        great: { key: 'great', label: 'Great League', cpLimit: 1500, entries: [] },
        ultra: { key: 'ultra', label: 'Ultra League', cpLimit: 2500, entries: [] },
        master: { key: 'master', label: 'Master League', cpLimit: null, entries: [] },
      },
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(pvpData), { status: 200 }),
    );

    await expect(getPokemonPvPDataChunk(manifest)).resolves.toEqual(pvpData);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/catalog/pvp-data'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('rejects an array-shaped PvP rankings chunk', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await expect(getPokemonPvPDataChunk(manifest)).rejects.toThrow(
      'invalid pvpData chunk shape',
    );
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('posts a bounded PvP battle simulation request', async () => {
    const request = {
      mechanics: 'pvpoke-legacy',
      fighters: [],
      shields: [1, 1],
      startingEnergy: [0, 0],
    } as unknown as PokemonPvPBattleRequest;
    const result = {
      mechanics: 'pvpoke-legacy',
      winner: 0,
      turns: 20,
      timeMs: 10_000,
      ratings: [600, 399],
      adjustedRatings: [600, 399],
      fighters: [],
      timeline: [],
    } as unknown as PokemonPvPBattleResponse;
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(result), { status: 200 }),
    );

    await expect(simulatePokemonPvPBattle(request)).resolves.toEqual(result);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/pvp-battle'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      }),
    );
  });

  it('surfaces the simulator validation message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'fast move data is incomplete' }), {
        status: 422,
      }),
    );

    await expect(
      simulatePokemonPvPBattle({} as PokemonPvPBattleRequest),
    ).rejects.toThrow('fast move data is incomplete');
  });

  it('retries a lazy catalog chunk once after a transient browser load failure', async () => {
    const moves = [{ pokemon_id: 1, moves: [], fusion: [], crownForms: [] }];
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockRejectedValueOnce(new TypeError('Load failed'))
      .mockResolvedValueOnce(new Response(JSON.stringify(moves), { status: 200 }));

    await expect(getPokemonMovesChunk(manifest)).resolves.toEqual(moves);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('does not retry malformed chunk payloads', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ pokemon_id: 1 }), { status: 200 }),
    );

    await expect(getPokemonMovesChunk(manifest)).rejects.toThrow(
      'invalid moves chunk shape',
    );
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('fetches and validates the pokemon catalog manifest', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(manifest), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getPokemonCatalogManifest()).resolves.toEqual(manifest);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/manifest'),
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    );
  });

  it('rejects invalid pokemon catalog manifests', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ schemaVersion: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getPokemonCatalogManifest()).rejects.toThrow('invalid manifest payload shape');
  });

  it('throws when API payload is not an array', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ data: payload }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(getPokemons()).rejects.toThrow('invalid payload shape');
  });

  it('ignores stale localStorage cache keys when fetching pokemon data', async () => {
    localStorage.setItem('pokemonData', JSON.stringify({ data: payload }));
    localStorage.setItem('pokemonDataEtag', '"abc123"');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ETag: '"abc123"' },
      }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/pokemons'),
      expect.objectContaining({
        method: 'GET',
        headers: {},
      }),
    );
    expect(localStorage.getItem('pokemonData')).toBeNull();
    expect(localStorage.getItem('pokemonDataEtag')).toBeNull();
  });

  it('does not store fresh API payload in localStorage', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ETag: '"etag-value"' },
      }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
    expect(localStorage.getItem('pokemonData')).toBeNull();
    expect(localStorage.getItem('pokemonDataEtag')).toBeNull();
  });

  it('rethrows network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

    await expect(getPokemons()).rejects.toThrow('Network Error');
  });
});

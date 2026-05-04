import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPokemons } from '@/services/pokemonDataService';
import { normalizeAssetUrlsDeep } from '@/utils/assetUrl';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonFixtures from '../../__helpers__/fixtures/pokemons.json' with { type: 'json' };

describe('pokemonDataService', () => {
  const payload = (pokemonFixtures as BasePokemon[]).slice(0, 2);

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

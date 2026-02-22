import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPokemons } from '@/services/pokemonDataService';
import { normalizeAssetUrlsDeep } from '@/utils/assetUrl';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonFixtures from '../../__helpers__/fixtures/pokemons.json' assert { type: 'json' };

describe('pokemonDataService', () => {
  const payload = (pokemonFixtures as BasePokemon[]).slice(0, 2);

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches pokemon data on 200 response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
  });

  it('uses cached payload on 304 response', async () => {
    localStorage.setItem('pokemonData', JSON.stringify({ data: payload }));
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 304 }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
  });

  it('supports legacy raw-array cache shape on 304 response', async () => {
    localStorage.setItem('pokemonData', JSON.stringify(payload));
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 304 }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
  });

  it('throws when 304 response has no cache', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 304 }),
    );

    await expect(getPokemons()).rejects.toThrow('No cached data available for 304 response');
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

  it('sends If-None-Match header when ETag cache exists', async () => {
    localStorage.setItem('pokemonDataEtag', '"abc123"');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ETag: '"abc123"' },
      }),
    );

    await getPokemons();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/pokemons'),
      expect.objectContaining({
        method: 'GET',
        headers: { 'If-None-Match': '"abc123"' },
      }),
    );
  });

  it('stores returned ETag after success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ETag: '"etag-value"' },
      }),
    );

    await getPokemons();

    expect(localStorage.getItem('pokemonDataEtag')).toBe('"etag-value"');
  });

  it('rethrows network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

    await expect(getPokemons()).rejects.toThrow('Network Error');
  });
});

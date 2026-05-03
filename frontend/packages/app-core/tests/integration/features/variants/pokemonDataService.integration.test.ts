import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPokemons } from '@/services/pokemonDataService';
import { normalizeAssetUrlsDeep } from '@/utils/assetUrl';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';

describe('pokemonDataService (integration)', () => {
  const payload = (pokemonsFixture as BasePokemon[]).slice(0, 25);

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns API payload on 200 response', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await getPokemons();

    expect(result).toEqual(normalizeAssetUrlsDeep(payload));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not use raw localStorage cache for pokemon data', async () => {
    localStorage.setItem('pokemonData', JSON.stringify({ data: payload }));
    localStorage.setItem('pokemonDataEtag', '"cached-etag"');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ETag: '"fresh-etag"' },
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
});

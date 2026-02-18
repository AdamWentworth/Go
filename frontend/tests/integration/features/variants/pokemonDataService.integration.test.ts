import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPokemons } from '@/services/pokemonDataService';
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

    expect(result).toEqual(payload);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to cached payload on 304 response', async () => {
    localStorage.setItem('pokemonData', JSON.stringify({ data: payload }));
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 304 }),
    );

    const result = await getPokemons();

    expect(result).toEqual(payload);
  });
});

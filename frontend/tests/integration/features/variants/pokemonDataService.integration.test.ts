import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';

import { getPokemons } from '@/services/pokemonDataService';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';

vi.mock('axios');
const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

describe('pokemonDataService (integration)', () => {
  const payload = (pokemonsFixture as BasePokemon[]).slice(0, 25);

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns API payload on 200 response', async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 200,
      data: payload,
    });

    const result = await getPokemons();

    expect(result).toEqual(payload);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to cached payload on 304 response', async () => {
    localStorage.setItem('pokemonData', JSON.stringify({ data: payload }));
    mockedAxios.get = vi.fn().mockResolvedValue({
      status: 304,
      data: null,
    });

    const result = await getPokemons();

    expect(result).toEqual(payload);
  });
});


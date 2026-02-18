import { beforeEach, describe, expect, it, vi } from 'vitest';

import { searchPokemon } from '@/services/searchService';

describe('searchService.searchPokemon', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns array payload from search endpoint', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ pokemon_id: 1 }, { pokemon_id: 2 }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await searchPokemon({ ownership: 'caught' });

    expect(result).toEqual([{ pokemon_id: 1 }, { pokemon_id: 2 }]);
  });

  it('normalizes object payload into array rows', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          a: { pokemon_id: 1 },
          b: { pokemon_id: 2 },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await searchPokemon({ ownership: 'trade' });

    expect(result).toEqual([{ pokemon_id: 1 }, { pokemon_id: 2 }]);
  });

  it('throws normalized error on non-2xx responses', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(searchPokemon({ ownership: 'wanted' })).rejects.toMatchObject({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { searchPokemon } from '@/services/searchService';

const makeJsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('searchService contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts /searchPokemon array payloads with required query row fields', async () => {
    const payload = [
      { pokemon_id: 1, distance: 12.5, username: 'ash' },
      { pokemon_id: 4, distance: 50.2, username: 'misty' },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(makeJsonResponse(200, payload));

    const result = await searchPokemon({ ownership: 'caught', limit: 20 });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    for (const row of result) {
      expect(typeof row.pokemon_id).toBe('number');
      expect(row.pokemon_id).toBeGreaterThan(0);
      if (row.distance !== undefined) {
        expect(typeof row.distance).toBe('number');
        expect(row.distance).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('accepts /searchPokemon object payloads and normalizes to list rows', async () => {
    const payload = {
      first: { pokemon_id: 25, distance: 1.23 },
      second: { pokemon_id: 133, distance: 4.56 },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(makeJsonResponse(200, payload));

    const result = await searchPokemon({ ownership: 'trade' });

    expect(result).toEqual([
      { pokemon_id: 25, distance: 1.23 },
      { pokemon_id: 133, distance: 4.56 },
    ]);
  });

  it('preserves status semantics for bad search requests', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      makeJsonResponse(400, { message: 'invalid query' }),
    );

    await expect(searchPokemon({ ownership: 'caught' })).rejects.toMatchObject({
      response: {
        status: 400,
        data: { message: 'invalid query' },
      },
    });
  });
});


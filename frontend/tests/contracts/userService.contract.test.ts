import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchUserOverview } from '@/services/userService';

const makeJsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('userService contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the expected overview envelope for /users/:id/overview', async () => {
    const payload = {
      user: {
        user_id: 'u-1',
        username: 'ash',
      },
      pokemon_instances: {
        '0001-default_uuid-1': {
          instance_id: '0001-default_uuid-1',
          variant_id: '0001-default',
          pokemon_id: 1,
          is_caught: true,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {
        '0001-default': true,
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(makeJsonResponse(200, payload));

    const result = await fetchUserOverview('u-1');
    const keys = Object.keys(result);

    expect(keys.sort()).toEqual(
      [
        'pokemon_instances',
        'registrations',
        'related_instances',
        'trades',
        'user',
      ].sort(),
    );
    expect(result.user).toMatchObject({
      user_id: 'u-1',
      username: 'ash',
    });
    expect(typeof result.pokemon_instances).toBe('object');
    expect(typeof result.trades).toBe('object');
    expect(typeof result.related_instances).toBe('object');
    expect(typeof result.registrations).toBe('object');
  });

  it('preserves status semantics for authorization failures', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      makeJsonResponse(403, { message: 'Forbidden' }),
    );

    await expect(fetchUserOverview('u-1')).rejects.toMatchObject({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    });
  });
});


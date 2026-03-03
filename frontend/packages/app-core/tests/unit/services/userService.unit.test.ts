import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchUserOverview } from '@/services/userService';

vi.mock('@/utils/deviceID', () => ({
  getDeviceId: () => 'device-456',
}));

describe('userService.fetchUserOverview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed overview on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          pokemon_instances: {},
          trades: {},
          related_instances: {},
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await fetchUserOverview('u-1');

    expect(result).toMatchObject({
      pokemon_instances: {},
      trades: {},
      related_instances: {},
    });
  });

  it('throws normalized error on non-2xx response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(fetchUserOverview('u-1')).rejects.toMatchObject({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    });
  });
});

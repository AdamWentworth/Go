import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchUpdates } from '@/services/sseService';

describe('sseService.fetchUpdates', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns payload on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ updates: [{ id: '1' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchUpdates('user-1', 'device-1', '12345');

    expect(result).toEqual({ updates: [{ id: '1' }] });
  });

  it('returns null on non-2xx response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await fetchUpdates('user-1', 'device-1', '12345');

    expect(result).toBeNull();
  });

  it('returns null on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('boom'));

    const result = await fetchUpdates('user-1', 'device-1', '12345');

    expect(result).toBeNull();
  });
});

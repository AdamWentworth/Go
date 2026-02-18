import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loginUser,
  refreshTokenService,
  updateUserDetails,
} from '@/services/authService';

vi.mock('@/utils/deviceID', () => ({
  getDeviceId: () => 'device-123',
}));

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits login payload with device id and returns response data', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'abc' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await loginUser({ username: 'ash', password: 'pikachu' });

    expect(result).toEqual({ token: 'abc' });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/login'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const body = requestInit.body ? JSON.parse(String(requestInit.body)) : {};
    expect(body).toMatchObject({
      username: 'ash',
      password: 'pikachu',
      device_id: 'device-123',
    });
  });

  it('returns typed error object when updateUserDetails receives non-2xx response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await updateUserDetails('u1', { username: 'misty' });

    expect(result).toEqual({
      success: false,
      error: 'nope',
    });
  });

  it('throws normalized api error on refresh token failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(refreshTokenService()).rejects.toMatchObject({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    });
  });
});

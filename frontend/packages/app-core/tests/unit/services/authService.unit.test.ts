import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loginUser,
  prepareFacebookAuthentication,
  refreshTokenService,
  resolveFacebookAuthorizationUrl,
  updateUserInSecondaryDB,
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

  it('submits secondary-db update payload to users service endpoint', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await updateUserInSecondaryDB('u1', {
      username: 'misty',
      pokemonGoName: 'Misty',
      latitude: 12.34,
      longitude: 56.78,
    });

    expect(result).toEqual({
      success: true,
      data: { ok: true },
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/update-user/u1'),
      expect.objectContaining({
        method: 'PUT',
      }),
    );

    const requestInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const body = requestInit.body ? JSON.parse(String(requestInit.body)) : {};
    expect(body).toMatchObject({
      username: 'misty',
      pokemonGoName: 'Misty',
      latitude: 12.34,
      longitude: 56.78,
    });
  });

  it('resolves Facebook direct navigation for an installed PWA with credentials', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        authorizationUrl: 'https://www.facebook.com/dialog/oauth?state=signed-state',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const startUrl = new URL('https://pokegonexus.com/api/auth/facebook?response_mode=json');

    await expect(resolveFacebookAuthorizationUrl(startUrl)).resolves.toBe(
      'https://www.facebook.com/dialog/oauth?state=signed-state',
    );
    expect(fetchSpy).toHaveBeenCalledWith(startUrl.toString(), {
      credentials: 'include',
    });
  });

  it('prepares Facebook registration before the PWA user gesture', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({
        authorizationUrl: 'https://www.facebook.com/dialog/oauth?state=prepared-state',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(prepareFacebookAuthentication('register')).resolves.toContain(
      'state=prepared-state',
    );
    const requestUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get('intent')).toBe('register');
    expect(requestUrl.searchParams.get('response_mode')).toBe('json');
    expect(requestUrl.searchParams.get('device_id')).toBe('device-123');
  });

  it('rejects an invalid Facebook direct-navigation response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(resolveFacebookAuthorizationUrl(
      new URL('https://pokegonexus.com/api/auth/facebook?response_mode=json'),
    )).rejects.toThrow('Facebook authorization URL was not provided.');
  });
});

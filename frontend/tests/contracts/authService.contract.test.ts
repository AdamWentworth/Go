import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loginUser, refreshTokenService } from '@/services/authService';

vi.mock('@/utils/deviceID', () => ({
  getDeviceId: () => 'device-contract-1',
}));

const makeJsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('authService contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts /login payload with required session bootstrap fields', async () => {
    const payload = {
      email: 'ash@example.com',
      username: 'ash',
      pokemonGoName: 'Ash Ketchum',
      trainerCode: '1234 5678 9012',
      user_id: 'u-1',
      token: 'jwt-token',
      allowLocation: true,
      location: 'Pallet Town',
      coordinates: {
        latitude: 35.68,
        longitude: 139.69,
      },
      accessTokenExpiry: '2099-01-01T00:00:00Z',
      refreshTokenExpiry: '2099-01-02T00:00:00Z',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(makeJsonResponse(200, payload));

    const result = (await loginUser({
      username: 'ash',
      password: 'pikachu',
    })) as Record<string, unknown>;

    expect(result).toMatchObject(payload);
    expect(typeof result.token).toBe('string');
    expect(typeof result.accessTokenExpiry).toBe('string');
    expect(typeof result.refreshTokenExpiry).toBe('string');
  });

  it('accepts /refresh payload with expected token expiry fields', async () => {
    const payload = {
      accessToken: 'new-access-token',
      accessTokenExpiry: '2099-01-03T00:00:00Z',
      refreshTokenExpiry: '2099-01-04T00:00:00Z',
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(makeJsonResponse(200, payload));

    const result = (await refreshTokenService()) as Record<string, unknown>;

    expect(result).toMatchObject(payload);
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.accessTokenExpiry).toBe('string');
    expect(typeof result.refreshTokenExpiry).toBe('string');
  });

  it('preserves status semantics for unauthorized refresh requests', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      makeJsonResponse(401, { message: 'Unauthorized' }),
    );

    await expect(refreshTokenService()).rejects.toMatchObject({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    });
  });
});


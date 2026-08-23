import { createMobileSessionApi } from '../../../src/auth/mobileSessionApi';

const response = (status: number, payload: unknown): Response => ({
  ok: status >= 200 && status < 300,
  status,
  text: jest.fn().mockResolvedValue(JSON.stringify(payload)),
}) as unknown as Response;

const session = {
  user: {
    user_id: 'user-1',
    username: 'misty',
    email: 'misty@example.invalid',
    pokemonGoName: null,
    trainerCode: null,
    allowLocation: false,
    location: null,
    coordinates: null,
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExpiry: '2026-08-23T22:00:00.000Z',
  refreshTokenExpiry: '2026-08-30T21:00:00.000Z',
};

describe('mobile session API', () => {
  it('uses explicit no-cookie mobile session endpoints', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(response(200, session))
      .mockResolvedValueOnce(response(200, session))
      .mockResolvedValueOnce(response(200, { message: 'Logged out successfully' }));
    const api = createMobileSessionApi(fetchMock);

    await api.login({ username: 'misty', password: 'password', device_id: 'native-device' });
    await api.refresh('refresh-token');
    await api.logout('refresh-token');

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://pokegonexus.com/api/auth/mobile/login',
      'https://pokegonexus.com/api/auth/mobile/refresh',
      'https://pokegonexus.com/api/auth/mobile/logout',
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toEqual(expect.objectContaining({ credentials: 'omit' }));
    }
  });

  it('rejects a malformed successful response', async () => {
    const api = createMobileSessionApi(
      jest.fn().mockResolvedValue(response(200, { message: 'missing tokens' })),
    );
    await expect(api.refresh('refresh-token')).rejects.toThrow(
      'Authentication service returned an invalid mobile session',
    );
  });
});

import { authContract } from '@pokemongonexus/shared-contracts/auth';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { loginUser, registerUser } from '../../../src/services/authService';

jest.mock('../../../src/features/events/eventsSession', () => ({
  getOrCreateDeviceId: jest.fn().mockResolvedValue('device-test-1'),
}));

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
}));

jest.mock('@pokemongonexus/shared-contracts/auth', () => ({
  authContract: {
    endpoints: {
      register: '/register',
      login: '/login',
      refresh: '/refresh',
      logout: '/logout',
    },
  },
}));

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

describe('authService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('posts login payload to shared auth contract endpoint', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, {
        token: 'jwt',
        user_id: 'u1',
        username: 'ash',
        email: 'ash@example.com',
        pokemonGoName: 'ash',
        trainerCode: '123412341234',
        location: '',
        allowLocation: false,
        coordinates: null,
        accessTokenExpiry: '2099-01-01T00:00:00.000Z',
        refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
      }),
    );

    await loginUser({ username: 'ash', password: 'pikachu' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.authApiUrl}${authContract.endpoints.login}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
    });
    const requestInit = fetchMock.mock.calls[0]?.[1];
    const body = requestInit && typeof requestInit === 'object' && 'body' in requestInit
      ? (requestInit as { body?: string }).body
      : undefined;
    expect(body).toBeDefined();
    expect(JSON.parse(body as string)).toMatchObject({
      username: 'ash',
      password: 'pikachu',
      device_id: 'device-test-1',
    });
  });

  it('posts register payload to shared auth contract endpoint', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, { success: true }),
    );

    await registerUser({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      pokemonGoName: 'NewUser',
      trainerCode: '123412341234',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.authApiUrl}${authContract.endpoints.register}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
    });
    const requestInit = fetchMock.mock.calls[0]?.[1];
    const body = requestInit && typeof requestInit === 'object' && 'body' in requestInit
      ? (requestInit as { body?: string }).body
      : undefined;
    expect(body).toBeDefined();
    expect(JSON.parse(body as string)).toMatchObject({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      pokemonGoName: 'NewUser',
      trainerCode: '123412341234',
      device_id: 'device-test-1',
    });
  });
});

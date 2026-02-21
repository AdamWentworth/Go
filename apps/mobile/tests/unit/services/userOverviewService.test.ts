import { usersContract } from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { setAuthToken, clearAuthToken } from '../../../src/features/auth/authSession';
import { fetchUserOverview } from '../../../src/services/userOverviewService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
}));

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

describe('userOverviewService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearAuthToken();
  });

  it('fetches overview from users endpoint with auth header when token exists', async () => {
    setAuthToken('jwt-token');
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, {
        user: { user_id: 'u1', username: 'ash' },
        pokemon_instances: {},
        trades: {},
        related_instances: {},
        registrations: {},
      }),
    );

    await fetchUserOverview('u1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.usersApiUrl}${usersContract.endpoints.userOverview('u1')}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({ Authorization: 'Bearer jwt-token' }),
    });
  });
});


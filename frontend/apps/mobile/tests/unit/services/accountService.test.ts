import { authContract } from '@pokemongonexus/shared-contracts/auth';
import { usersContract } from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import {
  deleteAccount,
  updateAuthAccount,
  updateSecondaryAccount,
} from '../../../src/services/accountService';

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

describe('accountService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('updates auth account profile', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse(200, {}));
    await updateAuthAccount('u1', { pokemonGoName: 'Ash' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.authApiUrl}${authContract.endpoints.updateUser('u1')}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' });
  });

  it('updates secondary account profile', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse(200, {}));
    await updateSecondaryAccount('u1', { username: 'ash', pokemonGoName: 'Ash' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.usersApiUrl}${usersContract.endpoints.updateUser('u1')}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT' });
  });

  it('deletes auth account', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse(200, {}));
    await deleteAccount('u1');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.authApiUrl}${authContract.endpoints.deleteUser('u1')}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});


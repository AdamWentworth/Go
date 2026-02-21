import { usersContract } from '@pokemongonexus/shared-contracts/users';
import {
  fetchForeignInstancesByUsername,
  fetchTrainerAutocomplete,
} from './userSearchService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
}));

const makeResponse = (
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
    headers: {
      get: (name: string) => {
        const direct = headers?.[name];
        if (typeof direct === 'string') return direct;
        return headers?.[name.toLowerCase()] ?? null;
      },
    },
  }) as unknown as Response;

describe('userSearchService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns trainer autocomplete results on success', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeResponse(200, [{ username: 'ash', pokemonGoName: 'Ash' }]));

    const outcome = await fetchTrainerAutocomplete('ash');

    expect(outcome).toEqual({
      type: 'success',
      results: [{ username: 'ash', pokemonGoName: 'Ash' }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      usersContract.endpoints.autocompleteTrainers('ash'),
    );
  });

  it('falls back to public endpoint when private lookup returns 403', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeResponse(403, { message: 'forbidden' }))
      .mockResolvedValueOnce(
        makeResponse(
          200,
          {
            username: 'Ash',
            instances: {
              i1: {},
            },
          },
          { ETag: 'etag-1' },
        ),
      );

    const outcome = await fetchForeignInstancesByUsername('Ash');

    expect(outcome).toEqual({
      type: 'success',
      username: 'Ash',
      instances: { i1: {} },
      etag: 'etag-1',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      usersContract.endpoints.instancesByUsername('Ash'),
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain(
      usersContract.endpoints.publicUserByUsername('Ash'),
    );
  });

  it('returns notModified outcome when server responds 304', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse(304, null));

    const outcome = await fetchForeignInstancesByUsername('misty', 'etag-123');

    expect(outcome).toEqual({ type: 'notModified' });
  });
});


import {
  getConnectivityState,
  requestWithPolicy,
  subscribeConnectivity,
} from '../../../src/services/httpClient';

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

describe('httpClient requestWithPolicy', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('retries once on retriable HTTP status and eventually succeeds', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeResponse(503, { message: 'temporary' }))
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));

    const response = await requestWithPolicy('https://example.com/resource', {
      method: 'GET',
      retryCount: 1,
      retryDelayMs: 0,
      retryStatusCodes: [503],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it('retries on transient network error and succeeds', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));

    const response = await requestWithPolicy('https://example.com/resource', {
      method: 'GET',
      retryCount: 1,
      retryDelayMs: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it('converts abort errors into timeout errors after retries are exhausted', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

    await expect(
      requestWithPolicy('https://example.com/slow', {
        method: 'GET',
        retryCount: 0,
        timeoutMs: 50,
      }),
    ).rejects.toThrow('Request timed out after 50ms');
  });

  it('tracks connectivity transitions across failed and successful requests', async () => {
    const connectivityTimeline: boolean[] = [];
    const unsubscribe = subscribeConnectivity((state) => {
      connectivityTimeline.push(state.online);
    });
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));

    await expect(
      requestWithPolicy('https://example.com/offline', {
        method: 'GET',
        retryCount: 0,
      }),
    ).rejects.toThrow('offline');

    expect(getConnectivityState().online).toBe(false);

    await requestWithPolicy('https://example.com/recovered', {
      method: 'GET',
      retryCount: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getConnectivityState().online).toBe(true);
    expect(connectivityTimeline).toContain(false);
    expect(connectivityTimeline).toContain(true);
    unsubscribe();
  });
});

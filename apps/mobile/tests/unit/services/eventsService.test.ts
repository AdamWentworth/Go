import { eventsContract } from '@pokemongonexus/shared-contracts/events';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { setAuthToken, clearAuthToken } from '../../../src/features/auth/authSession';
import {
  fetchSseStreamToken,
  fetchMissedUpdates,
  hasEventsDelta,
  normalizeEventsEnvelope,
} from '../../../src/services/eventsService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string, query?: Record<string, unknown>) => {
    const qs = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) qs.append(key, String(value));
      });
    }
    const suffix = qs.toString();
    return `${base}${path}${suffix ? `?${suffix}` : ''}`;
  },
}));

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

describe('eventsService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearAuthToken();
  });

  it('normalizes envelope maps and detects deltas', () => {
    const normalized = normalizeEventsEnvelope({
      pokemon: { i1: ({ instance_id: 'i1' } as unknown) as never },
      relatedInstance: { i2: ({ instance_id: 'i2' } as unknown) as never },
    });
    expect(Object.keys(normalized.pokemon)).toEqual(['i1']);
    expect(Object.keys(normalized.relatedInstances)).toEqual(['i2']);
    expect(hasEventsDelta(normalized)).toBe(true);
  });

  it('fetches missed updates with shared contract endpoint and auth cookie header', async () => {
    setAuthToken('jwt-token');
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, {
        trade: {
          t1: { trade_id: 't1', trade_status: 'pending' },
        },
      }),
    );

    const result = await fetchMissedUpdates('device-1', 1000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      `${runtimeConfig.api.eventsApiUrl}${eventsContract.endpoints.getUpdates}`,
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain('device_id=device-1');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('timestamp=1000');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({
        Cookie: expect.stringContaining('accessToken='),
      }),
    });
    expect(result?.trade.t1.trade_status).toBe('pending');
  });

  it('fetches SSE stream token with bearer auth header', async () => {
    setAuthToken('jwt-token');
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, {
        token: 'stream-token',
        expires_in_seconds: 300,
      }),
    );

    const token = await fetchSseStreamToken('device-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      `${runtimeConfig.api.eventsApiUrl}${eventsContract.endpoints.sseToken}`,
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain('device_id=device-1');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: 'Bearer jwt-token',
      }),
    });
    expect(token).toBe('stream-token');
  });
});

import type { IncomingUpdateEnvelope, UpdatesQueryParams } from '@pokemongonexus/shared-contracts/events';
import { eventsContract } from '@pokemongonexus/shared-contracts/events';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import { runtimeConfig } from '../config/runtimeConfig';
import { getAuthToken } from '../features/auth/authSession';
import { parseJsonSafe, requestWithPolicy } from './httpClient';

type InstanceMap = Record<string, PokemonInstance>;
type TradeMap = Record<string, TradeRecord>;

const buildEventsUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, string>,
): string => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (!query) return url.toString();
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

export type EventsEnvelope =
  IncomingUpdateEnvelope<InstanceMap, TradeMap, InstanceMap> & {
    relatedInstances?: InstanceMap;
  };

export type NormalizedEventsEnvelope = {
  pokemon: InstanceMap;
  trade: TradeMap;
  relatedInstances: InstanceMap;
};

const emptyEnvelope = (): NormalizedEventsEnvelope => ({
  pokemon: {},
  trade: {},
  relatedInstances: {},
});

const toRecord = <T>(value: unknown): Record<string, T> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, T>;
};

const buildCookieHeader = (token: string | null): string | null =>
  token && token.trim().length > 0 ? `accessToken=${encodeURIComponent(token)}` : null;

export const normalizeEventsEnvelope = (
  payload: EventsEnvelope | null | undefined,
): NormalizedEventsEnvelope => {
  if (!payload || typeof payload !== 'object') return emptyEnvelope();
  return {
    pokemon: toRecord<PokemonInstance>(payload.pokemon),
    trade: toRecord<TradeRecord>(payload.trade),
    relatedInstances: {
      ...toRecord<PokemonInstance>(payload.relatedInstance),
      ...toRecord<PokemonInstance>(payload.relatedInstances),
    },
  };
};

export const hasEventsDelta = (payload: NormalizedEventsEnvelope): boolean =>
  Object.keys(payload.pokemon).length > 0 ||
  Object.keys(payload.trade).length > 0 ||
  Object.keys(payload.relatedInstances).length > 0;

export const fetchMissedUpdates = async (
  deviceId: string,
  timestamp: number,
): Promise<NormalizedEventsEnvelope | null> => {
  const queryParams: UpdatesQueryParams = {
    device_id: deviceId,
    timestamp: String(timestamp),
  };
  const url = buildEventsUrl(
    runtimeConfig.api.eventsApiUrl,
    eventsContract.endpoints.getUpdates,
    queryParams,
  );
  const cookieHeader = buildCookieHeader(getAuthToken());

  const response = await requestWithPolicy(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    retryCount: 1,
    retryDelayMs: 250,
    timeoutMs: 8000,
  });

  if (response.status === 304 || response.status === 404 || response.status === 403) {
    return emptyEnvelope();
  }
  if (!response.ok) {
    return null;
  }
  const data = await parseJsonSafe<EventsEnvelope>(response);
  return normalizeEventsEnvelope(data);
};

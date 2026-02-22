import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { eventsContract } from '@pokemongonexus/shared-contracts/events';
import { useAuth } from '../auth/AuthProvider';
import { runtimeConfig } from '../../config/runtimeConfig';
import { getAuthToken } from '../auth/authSession';
import { logDebug, logWarn } from '../../observability/logger';
import {
  getOrCreateDeviceId,
  loadLastEventsTimestamp,
  saveLastEventsTimestamp,
} from './eventsSession';
import {
  fetchMissedUpdates,
  hasEventsDelta,
  type NormalizedEventsEnvelope,
} from '../../services/eventsService';

type EventsTransport = 'polling' | 'sse';

type EventsContextValue = {
  deviceId: string | null;
  transport: EventsTransport;
  connected: boolean;
  eventVersion: number;
  lastSyncAt: number | null;
  latestUpdate: NormalizedEventsEnvelope | null;
  syncing: boolean;
  error: string | null;
  refreshNow: () => Promise<void>;
};

const defaultEventsContextValue: EventsContextValue = {
  deviceId: null,
  transport: 'polling',
  connected: false,
  eventVersion: 0,
  lastSyncAt: null,
  latestUpdate: null,
  syncing: false,
  error: null,
  refreshNow: async () => {},
};

const EventsContext = createContext<EventsContextValue>(defaultEventsContextValue);

const POLL_INTERVAL_MS = 30_000;
const SSE_RECONNECT_DELAY_MS = 5_000;
const BOOTSTRAP_LOOKBACK_MS = 5 * 60_000;
const hasEventSourceRuntime = (): boolean =>
  typeof (globalThis as { EventSource?: unknown }).EventSource === 'function';

const stableSerialize = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const buildEnvelopeFingerprint = (updates: NormalizedEventsEnvelope): string =>
  stableSerialize(updates);

type EventSourceLike = {
  onopen: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  close: () => void;
};

const buildSseUrl = (deviceId: string): string => {
  const normalizedBase = runtimeConfig.api.eventsApiUrl.endsWith('/')
    ? runtimeConfig.api.eventsApiUrl
    : `${runtimeConfig.api.eventsApiUrl}/`;
  const normalizedPath = eventsContract.endpoints.sse.replace(/^\/+/, '');
  const url = new URL(normalizedPath, normalizedBase);
  url.searchParams.set('device_id', deviceId);
  const token = getAuthToken();
  if (token && token.trim().length > 0) {
    url.searchParams.set('access_token', token);
  }
  return url.toString();
};

export const EventsProvider = ({ children }: PropsWithChildren) => {
  const { status } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [transport, setTransport] = useState<EventsTransport>('polling');
  const [connected, setConnected] = useState(false);
  const [eventVersion, setEventVersion] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<NormalizedEventsEnvelope | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef(false);
  const lastTimestampRef = useRef<number>(Date.now());
  const lastDeltaFingerprintRef = useRef<string | null>(null);
  const sseRef = useRef<EventSourceLike | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const runIfMounted = useCallback((callback: () => void) => {
    if (mountedRef.current) {
      callback();
    }
  }, []);

  const closeStream = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    runIfMounted(() => {
      setConnected(false);
    });
  }, [runIfMounted]);

  const applyIncomingUpdates = useCallback(async (updates: NormalizedEventsEnvelope): Promise<void> => {
    const now = Date.now();
    lastTimestampRef.current = now;
    runIfMounted(() => {
      setLastSyncAt(now);
    });
    await saveLastEventsTimestamp(now);

    if (hasEventsDelta(updates)) {
      const fingerprint = buildEnvelopeFingerprint(updates);
      if (lastDeltaFingerprintRef.current === fingerprint) {
        return;
      }
      lastDeltaFingerprintRef.current = fingerprint;
      runIfMounted(() => {
        setLatestUpdate(updates);
        setEventVersion((version) => version + 1);
      });
    }
  }, [runIfMounted]);

  const connectStream = useCallback((): boolean => {
    if (!deviceId || status !== 'authenticated') return false;
    if (!hasEventSourceRuntime()) {
      runIfMounted(() => {
        setTransport('polling');
      });
      return false;
    }

    closeStream();
    try {
      const EventSourceCtor = (globalThis as { EventSource: new (url: string, options?: { withCredentials?: boolean }) => EventSourceLike }).EventSource;
      const source = new EventSourceCtor(buildSseUrl(deviceId), { withCredentials: true });
      sseRef.current = source;
      runIfMounted(() => {
        setTransport('sse');
      });

      source.onopen = () => {
        runIfMounted(() => {
          setConnected(true);
          setError(null);
        });
        logDebug('events', 'SSE stream connected');
      };
      source.onerror = () => {
        runIfMounted(() => {
          setConnected(false);
        });
        logWarn('events', 'SSE stream error; scheduling reconnect');
        closeStream();
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          void connectStream();
        }, SSE_RECONNECT_DELAY_MS);
      };
      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as NormalizedEventsEnvelope;
          const normalized: NormalizedEventsEnvelope = {
            pokemon: parsed?.pokemon ?? {},
            trade: parsed?.trade ?? {},
            relatedInstances: parsed?.relatedInstances ?? {},
          };
          void applyIncomingUpdates(normalized);
        } catch (nextError) {
          logWarn('events', 'Failed to parse SSE payload', nextError);
        }
      };
      return true;
    } catch (nextError) {
      runIfMounted(() => {
        setTransport('polling');
      });
      logWarn('events', 'SSE unavailable, falling back to polling', nextError);
      return false;
    }
  }, [applyIncomingUpdates, closeStream, deviceId, runIfMounted, status]);

  const bootstrapSession = useCallback(async (): Promise<void> => {
    const resolvedDeviceId = await getOrCreateDeviceId();
    const persistedTimestamp = await loadLastEventsTimestamp();
    setDeviceId(resolvedDeviceId);
    const initialTimestamp =
      persistedTimestamp && persistedTimestamp > 0
        ? persistedTimestamp
        : Date.now() - BOOTSTRAP_LOOKBACK_MS;
    lastTimestampRef.current = initialTimestamp;
    setLastSyncAt(initialTimestamp);
  }, []);

  const refreshNow = useCallback(async (): Promise<void> => {
    if (pollingRef.current || status !== 'authenticated') return;
    if (!deviceId) return;
    pollingRef.current = true;
    runIfMounted(() => {
      setSyncing(true);
      setError(null);
    });

    try {
      const timestamp = lastTimestampRef.current;
      const updates = await fetchMissedUpdates(deviceId, timestamp);
      runIfMounted(() => {
        setConnected(true);
      });
      if (updates) {
        await applyIncomingUpdates(updates);
      }
    } catch (nextError) {
      runIfMounted(() => {
        setConnected(false);
        setError(nextError instanceof Error ? nextError.message : 'Failed to sync realtime updates.');
      });
    } finally {
      runIfMounted(() => {
        setSyncing(false);
      });
      pollingRef.current = false;
    }
  }, [applyIncomingUpdates, deviceId, runIfMounted, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      closeStream();
      runIfMounted(() => {
        setLatestUpdate(null);
        setSyncing(false);
        setError(null);
        setConnected(false);
        setTransport('polling');
      });
      lastDeltaFingerprintRef.current = null;
      return;
    }

    void bootstrapSession();
  }, [bootstrapSession, closeStream, runIfMounted, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !deviceId) return;
    const streamConnected = connectStream();
    if (!streamConnected) {
      runIfMounted(() => {
        setTransport('polling');
      });
    }
    void refreshNow();
    const id = setInterval(() => {
      if (transport === 'sse' && connected) return;
      void refreshNow();
      if (transport === 'sse' && !connected) {
        void connectStream();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      closeStream();
    };
  }, [closeStream, connectStream, connected, deviceId, refreshNow, runIfMounted, status, transport]);

  const value = useMemo<EventsContextValue>(
    () => ({
      deviceId,
      transport,
      connected,
      eventVersion,
      lastSyncAt,
      latestUpdate,
      syncing,
      error,
      refreshNow,
    }),
    [connected, deviceId, error, eventVersion, lastSyncAt, latestUpdate, refreshNow, syncing, transport],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = (): EventsContextValue => useContext(EventsContext);

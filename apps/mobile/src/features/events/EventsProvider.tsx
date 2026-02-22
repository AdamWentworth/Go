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
import { useAuth } from '../auth/AuthProvider';
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

type EventsContextValue = {
  deviceId: string | null;
  eventVersion: number;
  lastSyncAt: number | null;
  latestUpdate: NormalizedEventsEnvelope | null;
  syncing: boolean;
  error: string | null;
  refreshNow: () => Promise<void>;
};

const defaultEventsContextValue: EventsContextValue = {
  deviceId: null,
  eventVersion: 0,
  lastSyncAt: null,
  latestUpdate: null,
  syncing: false,
  error: null,
  refreshNow: async () => {},
};

const EventsContext = createContext<EventsContextValue>(defaultEventsContextValue);

const POLL_INTERVAL_MS = 30_000;
const BOOTSTRAP_LOOKBACK_MS = 5 * 60_000;

export const EventsProvider = ({ children }: PropsWithChildren) => {
  const { status } = useAuth();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [eventVersion, setEventVersion] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<NormalizedEventsEnvelope | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef(false);
  const lastTimestampRef = useRef<number>(Date.now());

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
    setSyncing(true);
    setError(null);

    try {
      const timestamp = lastTimestampRef.current;
      const updates = await fetchMissedUpdates(deviceId, timestamp);
      const now = Date.now();
      lastTimestampRef.current = now;
      await saveLastEventsTimestamp(now);
      setLastSyncAt(now);

      if (updates && hasEventsDelta(updates)) {
        setLatestUpdate(updates);
        setEventVersion((version) => version + 1);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to sync realtime updates.');
    } finally {
      setSyncing(false);
      pollingRef.current = false;
    }
  }, [deviceId, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLatestUpdate(null);
      setSyncing(false);
      setError(null);
      return;
    }

    void bootstrapSession();
  }, [bootstrapSession, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !deviceId) return;
    void refreshNow();
    const id = setInterval(() => {
      void refreshNow();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [deviceId, refreshNow, status]);

  const value = useMemo<EventsContextValue>(
    () => ({
      deviceId,
      eventVersion,
      lastSyncAt,
      latestUpdate,
      syncing,
      error,
      refreshNow,
    }),
    [deviceId, eventVersion, lastSyncAt, latestUpdate, syncing, error, refreshNow],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

export const useEvents = (): EventsContextValue => useContext(EventsContext);

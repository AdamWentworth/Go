// src/contexts/EventsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

import { useAuth }             from './AuthContext';
import { useSessionStore } from '../stores/useSessionStore';
import { useAuthStore }      from '../stores/useAuthStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import type { Trade as TradeRecord, Instance as RelatedInstanceRecord } from '@/features/trades/store/useTradeStore';

/* NEW granular contexts */
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import type { Instances } from '@/types/instances';

import { fetchUpdates } from '../services/sseService';
import { getDeviceId }  from '../utils/deviceID';
import { createScopedLogger } from '@/utils/logger';
import type { IncomingUpdateEnvelope } from '@shared-contracts/events';

/* ---------- type helpers ---------- */
type PokemonUpdateData = Instances;
type TradeUpdateData = Record<string, TradeRecord>;
type RelatedInstanceUpdateData = Record<string, RelatedInstanceRecord>;
type IncomingUpdateData = IncomingUpdateEnvelope<
  PokemonUpdateData,
  TradeUpdateData,
  RelatedInstanceUpdateData
>;

type EventsContextType = Record<string, never>;

const EventsContext = createContext<EventsContextType>({});
export const useEvents = (): EventsContextType => useContext(EventsContext);
const log = createScopedLogger('EventsContext');

interface EventsProviderProps { children: ReactNode }

/* ==================================================================== */
/*  provider                                                            */
/* ==================================================================== */
export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  /* ──────────────────── app state ──────────────────── */
  const { isLoading: isAuthLoading }        = useAuth();
  const user = useAuthStore((s) => s.user);
  const variantsLoading = useVariantsStore((s) => s.variantsLoading);
  const setInstances = useInstancesStore((s) => s.setInstances);
  const ownershipLoading = useInstancesStore((s) => s.instancesLoading);
  const updateTradeData = useTradeStore((s) => s.updateTradeData);
  const { isLoggedIn }                            = useAuthStore();
  const lastUpdateTimestamp = useSessionStore(s => s.lastUpdateTimestamp);
  const updateTimestamp     = useSessionStore.getState().updateTimestamp;
  const isSessionNew        = useSessionStore(s => s.isSessionNew);

  /* combined “data still loading?” flag */
  const isDataLoading = variantsLoading || ownershipLoading;

  /* ──────────────────── refs ──────────────────── */
  const deviceIdRef       = useRef<string>(getDeviceId());
  const sseRef            = useRef<EventSource | null>(null);
  const hasInitRef        = useRef(false);

  /* ──────────────────── handlers ──────────────────── */
  const handleIncomingUpdate = useCallback(
    (data: IncomingUpdateData) => {
      log.debug('incoming', data);

      if (data.pokemon) {
        setInstances(data.pokemon);
        updateTimestamp(new Date());
      }
      if (data.trade || data.relatedInstance) {
        updateTradeData(data.trade, data.relatedInstance);
      }
    },
    [setInstances, updateTimestamp, updateTradeData],
  );

  const closeSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
      log.debug('connection closed');
    }
  }, []);

  const openSSE = useCallback(() => {
    if (!user) return;

    closeSSE();
    const url = `${import.meta.env.VITE_EVENTS_API_URL}/sse?device_id=${deviceIdRef.current}`;

    try {
      const es = new EventSource(url, { withCredentials: true });
      sseRef.current = es;

      es.onopen    = () => log.debug('open');
      es.onerror   = (e) => { log.error('error', e); closeSSE(); };
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as IncomingUpdateData;
          handleIncomingUpdate(parsed);
        } catch (err) {
          log.error('JSON parse error', err);
        }
      };
    } catch (err) {
      log.error('failed to establish connection', err);
    }
  }, [closeSSE, handleIncomingUpdate, user]);

  /* ──────────────────── first‑time init ──────────────────── */
  useEffect(() => {
    if (hasInitRef.current) return;

    if (user && !isAuthLoading && !isDataLoading && lastUpdateTimestamp !== null) {
      const proceed = async () => {
        if (isSessionNew) {
          try {
            log.debug('fetching missed updates');
            const updates = await fetchUpdates<IncomingUpdateData>(
              user.user_id,
              deviceIdRef.current,
              lastUpdateTimestamp.getTime().toString(),
            );

            if (updates?.pokemon || updates?.trade) {
              handleIncomingUpdate(updates);
            } else {
              updateTimestamp(new Date());
            }
          } catch (err) {
            log.error('fetchUpdates error', err);
          }
        }
        openSSE();
        hasInitRef.current = true;
      };
      void proceed();
    }
  }, [
    user,
    isAuthLoading,
    isDataLoading,
    lastUpdateTimestamp,
    isSessionNew,
    handleIncomingUpdate,
    updateTimestamp,
    openSSE,
  ]);

  /* ──────────────────── keep‑alive / reconnect ──────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      if (user && !isAuthLoading && !isDataLoading && lastUpdateTimestamp && !sseRef.current) {
        log.warn('lost connection, reconnecting');
        openSSE();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [user, isAuthLoading, isDataLoading, lastUpdateTimestamp, openSSE]);

  /* ──────────────────── cleanup on unmount / logout ──────────────────── */
  useEffect(() => closeSSE, [closeSSE]);
  useEffect(() => {
    if (!isLoggedIn) {
      closeSSE();
      hasInitRef.current = false;
    }
  }, [isLoggedIn, closeSSE]);

  /* ──────────────────── provider ──────────────────── */
  return (
    <EventsContext.Provider value={{}}>
      {children}
    </EventsContext.Provider>
  );
};

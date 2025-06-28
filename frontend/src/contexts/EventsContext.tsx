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

/* NEW granular contexts */
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import { fetchUpdates } from '../services/sseService';
import { getDeviceId }  from '../utils/deviceID';

/* ---------- type helpers ---------- */
interface PokemonUpdateData { [key: string]: any }
interface TradeUpdateData   { [key: string]: any }

interface IncomingUpdateData {
  pokemon?:          PokemonUpdateData;
  trade?:            TradeUpdateData;
  relatedInstance?:  any;
}

interface EventsContextType {}          // (extend later if you expose helpers)

const EventsContext = createContext<EventsContextType>({});
export const useEvents = (): EventsContextType => useContext(EventsContext);

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
      console.log('[SSE] incoming:', data);

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
      console.log('[SSE] connection closed');
    }
  }, []);

  const openSSE = useCallback(() => {
    if (!user) return;

    closeSSE();
    const url = `${import.meta.env.VITE_EVENTS_API_URL}/sse?device_id=${deviceIdRef.current}`;

    try {
      const es = new EventSource(url, { withCredentials: true });
      sseRef.current = es;

      es.onopen    = () => console.log('[SSE] open');
      es.onerror   = (e) => { console.error('[SSE] error', e); closeSSE(); };
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data) as IncomingUpdateData;
          handleIncomingUpdate(parsed);
        } catch (err) {
          console.error('[SSE] JSON parse error', err);
        }
      };
    } catch (err) {
      console.error('[SSE] failed to establish connection', err);
    }
  }, [closeSSE, handleIncomingUpdate, user]);

  /* ──────────────────── first‑time init ──────────────────── */
  useEffect(() => {
    if (hasInitRef.current) return;

    if (user && !isAuthLoading && !isDataLoading && lastUpdateTimestamp !== null) {
      const proceed = async () => {
        if (isSessionNew) {
          try {
            console.log('[SSE] fetching missed updates …');
            const updates = (await fetchUpdates(
              user.user_id,
              deviceIdRef.current,
              lastUpdateTimestamp.getTime().toString(),
            )) as IncomingUpdateData;

            if (updates?.pokemon || updates?.trade) {
              handleIncomingUpdate(updates);
            } else {
              updateTimestamp(new Date());
            }
          } catch (err) {
            console.error('[SSE] fetchUpdates error', err);
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
        console.log('[SSE] lost connection, reconnecting …');
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

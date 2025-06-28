// useBootstrapTrades.ts

import { useEffect } from 'react';

import { useTradeStore } from '@/features/trades/store/useTradeStore';

/**
 * Bootstraps the trade Zustand store on app start‑up.
 *
 * ‑ Hydrates from IndexedDB once.
 * ‑ Can be extended later (e.g. socket listeners, polling).
 */
export function useBootstrapTrades() {
  const hydrateFromDB = useTradeStore((s) => s.hydrateFromDB);

  useEffect(() => {
    hydrateFromDB();
  }, [hydrateFromDB]);
}

// src/features/trades/store/useTradeStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  POKEMON_TRADES_STORE,
  RELATED_INSTANCES_STORE,
} from '@/db/indexedDB';

import { proposeTrade as proposeTradeService } from '@/features/trades/actions/proposeTrade';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import {
  setTradesinDB,
  getAllFromTradesDB,
  putBatchedTradeUpdates,
  deleteFromTradesDB,
} from '@/db/indexedDB';

// ────────────────────────────────────────────────────────────────────────────────
//  Types – keep loose for now; tighten later once compilation passes everywhere
// ────────────────────────────────────────────────────────────────────────────────
export interface Trade {
  trade_id: string;
  trade_status: string;
  [key: string]: unknown;
}

export interface Instance {
  instance_id: string;
  [key: string]: unknown;
}

interface TradeStoreState {
  /** keyed by trade_id */
  trades: Record<string, Trade>;
  /** keyed by instance_id */
  relatedInstances: Record<string, Instance>;

  // ACTIONS
  setTradeData: (obj: Record<string, Trade>) => Promise<Record<string, Trade> | void>;
  setRelatedInstances: (obj: Record<string, Instance>) => Promise<Record<string, Instance> | void>;
  updateTradeData: (
    trades?: Record<string, Trade>,
    instances?: Record<string, Instance>,
  ) => Promise<void>;
  proposeTrade: (tradeData: unknown) => Promise<
    | { success: true; tradeId: string }
    | { success: false; error: string }
  >;
  resetTradeData: () => void;
  hydrateFromDB: () => Promise<void>;
}

// ────────────────────────────────────────────────────────────────────────────────
//  Store factory – subscribeWithSelector to enable fine‑grained subscriptions
// ────────────────────────────────────────────────────────────────────────────────
export const useTradeStore = create<TradeStoreState>()(
  subscribeWithSelector((set, get) => ({
    /* ----------------------------------------------------------------------- */
    // STATE                                                               
    /* ----------------------------------------------------------------------- */
    trades: {},
    relatedInstances: {},

    /* ----------------------------------------------------------------------- */
    // ACTIONS                                                                
    /* ----------------------------------------------------------------------- */
    async setTradeData(newTradesObj) {
      if (!newTradesObj) return;

      // Handle deletions first so we don't accidentally persist removed rows
      for (const [id, trade] of Object.entries(newTradesObj)) {
        if (trade?.trade_status === 'deleted') {
          // remove from DB
          await deleteFromTradesDB(POKEMON_TRADES_STORE, id);
          // strip from incoming object so it doesn't land in state later
          delete newTradesObj[id];
        }
      }

      // Persist remaining trades (if any)
      const remaining = Object.keys(newTradesObj);
      if (remaining.length) {
        const array = remaining.map((trade_id) => ({
          ...newTradesObj[trade_id],
          trade_id,                           // ✅ only explicit once
        }));
        await setTradesinDB(POKEMON_TRADES_STORE, array as any);
      }

      // Merge into in‑memory state; deletions have been stripped already
      set((state) => ({ trades: { ...state.trades, ...newTradesObj } }));

      return newTradesObj;
    },

    async setRelatedInstances(newInstancesObj) {
      if (!newInstancesObj) return;

      const array = Object.keys(newInstancesObj).map((instance_id) => ({
        ...newInstancesObj[instance_id],
        instance_id,
      }));

      await setTradesinDB('relatedInstances', array as any);
      set((state) => ({
        relatedInstances: { ...state.relatedInstances, ...newInstancesObj },
      }));
      return newInstancesObj;
    },

    /** Combined updater used by sockets / polling layers */
    async updateTradeData(newTrades, newInstances) {
      try {
        const combinedTradeUpdates: Record<string, Trade> = newTrades
          ? { ...newTrades }
          : {};

        // Conflict resolution for trades transitioning to "pending"
        if (newTrades) {
          const snapshot = { ...get().trades, ...newTrades };

          for (const trade of Object.values(newTrades)) {
            if (trade.trade_status !== 'pending') continue;

            const { pokemon_instance_id_user_accepting: acc, pokemon_instance_id_user_proposed: prop } =
              trade as any; // loose typing for now

            for (const [id, t] of Object.entries(snapshot)) {
              if (id === trade.trade_id || t.trade_status !== 'proposed') continue;

              const clash =
                t.pokemon_instance_id_user_accepting === acc ||
                t.pokemon_instance_id_user_accepting === prop ||
                t.pokemon_instance_id_user_proposed === acc ||
                t.pokemon_instance_id_user_proposed === prop;

              if (clash) {
                combinedTradeUpdates[id] = {
                  ...t,
                  trade_status: 'deleted',
                  trade_deleted_date: new Date().toISOString(),
                  last_update: Date.now(),
                } as Trade;
              }
            }
          }
        }

        if (Object.keys(combinedTradeUpdates).length) {
          await get().setTradeData(combinedTradeUpdates);
        }

        if (newInstances) {
          await get().setRelatedInstances(newInstances);
        }
      } catch (err) {
        console.error('[updateTradeData] ERROR:', err);
      }
    },

    async proposeTrade(tradeData) {
      try {
        // Prepare data (no DB yet)
        const { tradeEntry, relatedInstanceData } = (await proposeTradeService(
          tradeData as any,
        )) as any;

        const tradeId = tradeEntry.trade_id;

        await get().setTradeData({ [tradeId]: tradeEntry });
        await get().setRelatedInstances({ [relatedInstanceData.instance_id]: relatedInstanceData });

        await putBatchedTradeUpdates(tradeId, {
          operation: 'createTrade',
          tradeData: tradeEntry,
        });

        // trigger polling / sync cycle
        const { periodicUpdates } = useInstancesStore.getState();
        periodicUpdates();

        return { success: true, tradeId } as const;
      } catch (error: any) {
        return { success: false, error: error.message } as const;
      }
    },

    resetTradeData() {
      set({ trades: {}, relatedInstances: {} });
    },

    /** Hydrate store from IndexedDB at app start‑up */
    async hydrateFromDB() {
      try {
        const tradesFromDB = await getAllFromTradesDB(POKEMON_TRADES_STORE);
        const tradesObj = tradesFromDB.reduce<Record<string, Trade>>((acc, trade: any) => {
          acc[trade.trade_id] = { ...trade };
          return acc;
        }, {});

        const instancesFromDB = await getAllFromTradesDB(RELATED_INSTANCES_STORE);
        const instancesObj = instancesFromDB.reduce<Record<string, Instance>>((acc, inst: any) => {
          acc[inst.instance_id] = { ...inst };
          return acc;
        }, {});

        set({ trades: tradesObj, relatedInstances: instancesObj });
      } catch (err) {
        console.error('[hydrateFromDB] ERROR:', err);
      }
    },
  })),
);

// Convenience wrapper matching previous API
export const useTradeData = () => useTradeStore();


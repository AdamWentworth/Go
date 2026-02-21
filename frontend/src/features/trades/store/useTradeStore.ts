import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createScopedLogger } from '@/utils/logger';

import {
  POKEMON_TRADES_STORE,
  RELATED_INSTANCES_STORE,
  setTradesinDB,
  getAllFromTradesDB,
  putBatchedTradeUpdates,
  deleteFromTradesDB,
} from '@/db/indexedDB';

import { proposeTrade as proposeTradeService } from '@/features/trades/actions/proposeTrade';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import type {
  RelatedInstanceRecord,
  TradeRecord,
} from '@shared-contracts/trades';

const log = createScopedLogger('useTradeStore');

type ProposeTradeInput = Parameters<typeof proposeTradeService>[0];
type ProposeTradeOutput = Awaited<ReturnType<typeof proposeTradeService>>;

export type Trade = TradeRecord;
export type RelatedInstance = RelatedInstanceRecord;

// Backward-compatible type alias used by existing imports.
export type Instance = RelatedInstance;

interface TradeStoreState {
  trades: Record<string, Trade>;
  relatedInstances: Record<string, RelatedInstance>;
  setTradeData: (
    obj: Record<string, Trade>,
  ) => Promise<Record<string, Trade> | void>;
  setRelatedInstances: (
    obj: Record<string, RelatedInstance>,
  ) => Promise<Record<string, RelatedInstance> | void>;
  updateTradeData: (
    trades?: Record<string, Trade>,
    instances?: Record<string, RelatedInstance>,
  ) => Promise<void>;
  proposeTrade: (
    tradeData: ProposeTradeInput,
  ) => Promise<{ success: true; tradeId: string } | { success: false; error: string }>;
  resetTradeData: () => void;
  hydrateFromDB: () => Promise<void>;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown trade error';
};

export const useTradeStore = create<TradeStoreState>()(
  subscribeWithSelector((set, get) => ({
    trades: {},
    relatedInstances: {},

    async setTradeData(newTradesObj) {
      if (!newTradesObj) return;

      const mutableTrades = { ...newTradesObj };

      for (const [tradeId, trade] of Object.entries(mutableTrades)) {
        if (trade?.trade_status === 'deleted') {
          await deleteFromTradesDB(POKEMON_TRADES_STORE, tradeId);
          delete mutableTrades[tradeId];
        }
      }

      const rowsToPersist = Object.entries(mutableTrades).map(([tradeId, trade]) => ({
        ...trade,
        trade_id: tradeId,
      }));

      if (rowsToPersist.length > 0) {
        await setTradesinDB(POKEMON_TRADES_STORE, rowsToPersist);
      }

      set((state) => ({
        trades: { ...state.trades, ...mutableTrades },
      }));

      return mutableTrades;
    },

    async setRelatedInstances(newInstancesObj) {
      if (!newInstancesObj) return;

      const rowsToPersist = Object.entries(newInstancesObj).map(
        ([instanceId, instance]) => ({
          ...instance,
          instance_id: instanceId,
        }),
      );

      await setTradesinDB(RELATED_INSTANCES_STORE, rowsToPersist);

      set((state) => ({
        relatedInstances: { ...state.relatedInstances, ...newInstancesObj },
      }));

      return newInstancesObj;
    },

    async updateTradeData(newTrades, newInstances) {
      try {
        const combinedTradeUpdates: Record<string, Trade> = newTrades
          ? { ...newTrades }
          : {};

        if (newTrades) {
          const snapshot = { ...get().trades, ...newTrades };

          for (const trade of Object.values(newTrades)) {
            if (trade.trade_status !== 'pending') continue;

            const acceptingId = trade.pokemon_instance_id_user_accepting ?? null;
            const proposedId = trade.pokemon_instance_id_user_proposed ?? null;

            for (const [tradeId, existingTrade] of Object.entries(snapshot)) {
              if (
                tradeId === trade.trade_id ||
                existingTrade.trade_status !== 'proposed'
              ) {
                continue;
              }

              const clash =
                existingTrade.pokemon_instance_id_user_accepting === acceptingId ||
                existingTrade.pokemon_instance_id_user_accepting === proposedId ||
                existingTrade.pokemon_instance_id_user_proposed === acceptingId ||
                existingTrade.pokemon_instance_id_user_proposed === proposedId;

              if (!clash) continue;

              combinedTradeUpdates[tradeId] = {
                ...existingTrade,
                trade_status: 'deleted',
                trade_deleted_date: new Date().toISOString(),
                last_update: Date.now(),
              };
            }
          }
        }

        if (Object.keys(combinedTradeUpdates).length > 0) {
          await get().setTradeData(combinedTradeUpdates);
        }

        if (newInstances) {
          await get().setRelatedInstances(newInstances);
        }
      } catch (error) {
        log.error('updateTradeData error:', error);
      }
    },

    async proposeTrade(tradeData) {
      try {
        const { tradeEntry, relatedInstanceData }: ProposeTradeOutput =
          await proposeTradeService(tradeData);

        const tradeId = tradeEntry.trade_id;
        const canonicalTrade: Trade = {
          ...tradeEntry,
          trade_id: String(tradeEntry.trade_id),
          trade_status: String(tradeEntry.trade_status),
        };
        const canonicalInstance: RelatedInstance = {
          ...relatedInstanceData,
          instance_id: String(relatedInstanceData.instance_id ?? ''),
        };

        await get().setTradeData({ [tradeId]: canonicalTrade });
        await get().setRelatedInstances({
          [canonicalInstance.instance_id]: canonicalInstance,
        });

        await putBatchedTradeUpdates(tradeId, {
          operation: 'createTrade',
          tradeData: tradeEntry,
        });

        const { periodicUpdates } = useInstancesStore.getState();
        periodicUpdates();

        return { success: true, tradeId } as const;
      } catch (error) {
        return { success: false, error: getErrorMessage(error) } as const;
      }
    },

    resetTradeData() {
      set({ trades: {}, relatedInstances: {} });
    },

    async hydrateFromDB() {
      try {
        const tradesFromDB = await getAllFromTradesDB<Trade>(POKEMON_TRADES_STORE);
        const tradesObj = tradesFromDB.reduce<Record<string, Trade>>((acc, trade) => {
          if (typeof trade.trade_id === 'string' && trade.trade_id.length > 0) {
            acc[trade.trade_id] = { ...trade };
          }
          return acc;
        }, {});

        const instancesFromDB =
          await getAllFromTradesDB<RelatedInstance>(RELATED_INSTANCES_STORE);
        const instancesObj = instancesFromDB.reduce<Record<string, RelatedInstance>>(
          (acc, instance) => {
            if (
              typeof instance.instance_id === 'string' &&
              instance.instance_id.length > 0
            ) {
              acc[instance.instance_id] = { ...instance };
            }
            return acc;
          },
          {},
        );

        set({ trades: tradesObj, relatedInstances: instancesObj });
      } catch (error) {
        log.error('hydrateFromDB error:', error);
      }
    },
  })),
);

export const useTradeData = () => useTradeStore();

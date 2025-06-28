// handleDeleteTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";

export interface Trade {
  trade_id: string;
  trade_status: string;
  trade_deleted_date?: string | null;
  last_update: number;
  // Add any additional properties required by your application.
}

export interface HandleDeleteTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

/**
 * Marks a trade as deleted by updating its status and deletion timestamp,
 * persists the updated trades state, and batches an update for the backend.
 * Then, triggers periodic updates.
 */
export async function handleDeleteTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleDeleteTradeArgs): Promise<void> {
  // 1) Clone existing trades.
  const updatedTrades: Record<string, Trade> = { ...trades };

  // 2) Mark the specific trade with "deleted" status.
  updatedTrades[trade.trade_id] = {
    ...trade,
    trade_status: 'deleted',
    trade_deleted_date: new Date().toISOString(),
    last_update: Date.now(),
  };

  try {
    // 3) Persist the updated trades state.
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleDeleteTrade] Error persisting trade data:", error);
    return;
  }

  // Prepare batched update data for updating the trade.
  const updatedTrade: Trade = {
    ...trade,
    trade_deleted_date: new Date().toISOString(),
    trade_status: 'deleted',
    last_update: Date.now(),
  };

  const batchedUpdateData = {
    operation: 'updateTrade', // or 'deleteTrade' if your backend expects a different operation.
    tradeData: updatedTrade,
  };

  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleDeleteTrade] Error in putBatchedTradeUpdates:", error);
  }

  periodicUpdates();
  console.log("[handleDeleteTrade] Completed.");
}

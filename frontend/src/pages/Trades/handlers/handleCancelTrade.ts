// handleCancelTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";

export interface Trade {
  trade_id: string;
  trade_cancelled_date?: string | null;
  trade_status: string;
  trade_cancelled_by?: string | null;
  last_update: number;
  // Add any additional properties if required.
}

export interface HandleCancelTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  currentUsername: string;
}

/**
 * Cancels a trade by updating its status to 'cancelled', setting a cancelled date,
 * recording who cancelled the trade, and updating the last update timestamp.
 * It persists the updated trades state and batches an update for the backend.
 */
export async function handleCancelTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
  currentUsername,
}: HandleCancelTradeArgs): Promise<void> {
  // Create an updated trade object with a cancelled date, new status, updated timestamp, and the cancelling user.
  const updatedTrade: Trade = {
    ...trade,
    trade_cancelled_date: new Date().toISOString(),
    trade_status: 'cancelled',
    trade_cancelled_by: currentUsername,
    last_update: Date.now(),
  };

  // Update the in-memory trades collection.
  const updatedTrades: Record<string, Trade> = {
    ...trades,
    [trade.trade_id]: updatedTrade,
  };

  // Persist the updated trades data.
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleCancelTrade] Error persisting trade data:", error);
    return;
  }

  // Prepare batched update data for updating the trade as cancelled.
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };

  // Execute the batched update operation.
  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleCancelTrade] Error in putBatchedTradeUpdates:", error);
  }

  // Trigger periodic updates after marking trade as cancelled.
  periodicUpdates();
  console.log("[handleCancelTrade] Completed.");
}

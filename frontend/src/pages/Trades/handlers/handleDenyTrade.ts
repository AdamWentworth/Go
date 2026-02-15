// handleDenyTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('handleDenyTrade');

export interface Trade {
  trade_id: string;
  trade_deleted_date?: string | null;
  trade_status: string;
  last_update: number;
  // Add additional properties as required.
}

export interface HandleDenyTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

/**
 * Denies a trade by updating its status to 'denied', setting the deletion date, and updating the timestamp.
 * It then updates the trades state and triggers periodic updates.
 */
export async function handleDenyTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleDenyTradeArgs): Promise<void> {
  // Create an updated trade object with deletion date, new status, and updated timestamp.
  const updatedTrade: Trade = {
    ...trade,
    trade_deleted_date: new Date().toISOString(), // Set deletion date to current time.
    trade_status: 'denied',                         // Update status to 'denied'.
    last_update: Date.now(),                         // Update last_update timestamp.
  };

  // Update the trades collection with the modified trade.
  const updatedTrades: Record<string, Trade> = {
    ...trades,
    [trade.trade_id]: updatedTrade,
  };

  // Persist the updated trades data.
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    log.error('Error persisting trade data', error);
    return;
  }

  // Prepare batched update data for updating the trade.
  const batchedUpdateData = {
    operation: 'updateTrade', // Use 'updateTrade' to indicate a status update, not a removal.
    tradeData: updatedTrade,
  };

  // Execute the batched update operation.
  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    log.error('Error in putBatchedTradeUpdates', error);
  }

  // Trigger periodic updates after marking the trade as denied.
  periodicUpdates();
  log.debug('Completed');
}

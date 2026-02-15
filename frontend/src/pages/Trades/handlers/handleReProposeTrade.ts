// handleReProposeTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('handleReProposeTrade');

export interface Trade {
  trade_id: string;
  username_proposed: string;
  username_accepting: string;
  trade_status: string;
  trade_accepted_date: string | null;
  trade_completed_date: string | null;
  trade_cancelled_date: string | null;
  trade_cancelled_by: string | null;
  trade_deleted_date: string | null;
  trade_proposal_date: string;
  last_update: number;
  // Include any additional properties if required.
}

export interface HandleReProposeTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  currentUsername: string;
}

/**
 * Resets a cancelled trade back to the 'proposed' status,
 * clearing out any accepted/cancelled/completed timestamps.
 *
 * - If you'd like to change who is the "proposer," update 
 *   username_proposed/username_accepting accordingly.
 */
export async function handleReProposeTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
  currentUsername,
}: HandleReProposeTradeArgs): Promise<void> {
  // Determine new proposer and accepter based on the current user.
  const originalProposer = trade.username_proposed;
  const originalAccepter = trade.username_accepting;

  let newProposer = originalProposer;
  let newAccepter = originalAccepter;
  if (currentUsername !== originalProposer) {
    newProposer = currentUsername;
    newAccepter = originalProposer;
  }

  // Create an updated trade object with reset timestamps and new proposal date.
  const updatedTrade: Trade = {
    ...trade,
    trade_status: "proposed",
    username_proposed: newProposer,
    username_accepting: newAccepter,
    trade_accepted_date: null,
    trade_completed_date: null,
    trade_cancelled_date: null,
    trade_cancelled_by: null,
    trade_deleted_date: null,
    trade_proposal_date: new Date().toISOString(),
    last_update: Date.now()
  };

  // Merge into the trades state.
  const updatedTrades: Record<string, Trade> = {
    ...trades,
    [trade.trade_id]: updatedTrade,
  };

  // Persist the updated trade data.
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    log.error('Error persisting trade data', error);
    return;
  }

  // Prepare a batched update for IndexedDB.
  const batchedUpdateData = {
    operation: "updateTrade",
    tradeData: updatedTrade,
  };

  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    log.error('Error in putBatchedTradeUpdates', error);
  }

  // Trigger periodic updates.
  periodicUpdates();
  log.debug("Trade has been reset to 'proposed' with new proposal date");
}

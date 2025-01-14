// handleReProposeTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

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
  currentUsername
}) {
  // Decide who should be the "proposer" if you want the current user
  // to become the new proposer. You can keep the original usernames
  // or swap them based on your logic. For simplicity, we do this:
  //    username_proposed = currentUsername
  //    username_accepting = the other user
  const originalProposer = trade.username_proposed;
  const originalAccepter = trade.username_accepting;

  // If the current user was not the original proposer, we swap them.
  // Otherwise, we keep them as originally was.
  let newProposer = originalProposer;
  let newAccepter = originalAccepter;
  if (currentUsername !== originalProposer) {
    newProposer = currentUsername;
    newAccepter = originalProposer;
  }

  // Create an updated trade object
  const updatedTrade = {
    ...trade,
    trade_status: "proposed",
    username_proposed: newProposer,
    username_accepting: newAccepter,

    // Reset timestamps
    trade_accepted_date: null,
    trade_completed_date: null,
    trade_cancelled_date: null,
    trade_cancelled_by: null,
    trade_deleted_date: null,

    // Set new proposal timestamp
    trade_proposal_date: new Date().toISOString(),

    // Update last update timestamp
    last_update: Date.now()
  };

  // Merge into your trades state
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trade data in state/IndexedDB
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleReProposeTrade] Error persisting trade data:", error);
    return;
  }

  // Prepare a batched update for IndexedDB
  const batchedUpdateData = {
    operation: "updateTrade",
    tradeData: updatedTrade
  };

  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleReProposeTrade] Error in putBatchedTradeUpdates:", error);
  }

  // Trigger your periodic sync or updates
  periodicUpdates();
  console.log("[handleReProposeTrade] Trade has been reset to 'proposed' with new proposal date.");
}

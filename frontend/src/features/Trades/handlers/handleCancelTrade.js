// handleCancelTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleCancelTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // Create an updated trade object with a cancelled date, new status, and updated timestamp
  const updatedTrade = {
    ...trade,
    trade_cancelled_date: new Date().toISOString(), // Set cancelled date
    trade_status: 'cancelled',                      // Update status to 'cancelled'
    last_update: Date.now(),                        // Update last_update timestamp
  };

  // Update the in-memory trades collection
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleCancelTrade] Error persisting trade data:", error);
    return;
  }

  // Prepare batched update data for updating the trade as cancelled
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };

  // Execute the batched update operation
  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleCancelTrade] Error in putBatchedTradeUpdates:", error);
  }

  // Trigger periodic updates after marking trade as cancelled
  periodicUpdates();
  console.log("[handleCancelTrade] Completed.");
}

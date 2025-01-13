// handleDenyTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleDenyTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // Create an updated trade object with deletion date, new status, and updated timestamp
  const updatedTrade = {
    ...trade,
    trade_deleted_date: new Date().toISOString(), // Set deletion date to current time
    trade_status: 'denied',                     // Update status to 'denied'
    last_update: Date.now(),                     // Update last_update timestamp
  };

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data with the modified trade
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleDenyTrade] Error persisting trade data:", error);
    return;
  }

  // Prepare batched update data for updating the trade as deleted
  const batchedUpdateData = {
    operation: 'updateTrade', // use 'updateTrade' to indicate a status update, not a removal
    tradeData: updatedTrade,
  };

  // Execute the batched update operation
  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleDeleteTrade] Error in putBatchedTradeUpdates:", error);
  }

  // Trigger periodic updates after marking trade as deleted
  periodicUpdates();
  console.log("[handleDeleteTrade] Completed.");
}

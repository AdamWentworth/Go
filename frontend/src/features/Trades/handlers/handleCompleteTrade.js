// handleCompleteTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleCompleteTrade({ trade, trades, setTradeData, periodicUpdates }) {

  // Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_completed_date: new Date().toISOString(), // Set accepted date to current time
    trade_status: 'completed',                        // Update status to 'completed'
    last_update: Date.now(),
  };

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data using setTradeData
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleCompleteTrade] Error persisting trade data:", error);
  }

  // Prepare batched update data
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };

  try {
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleCompleteTrade] Error in putBatchedTradeUpdates:", error);
  }

  periodicUpdates();
  console.log("[handleCompleteTrade] Completed.");
}

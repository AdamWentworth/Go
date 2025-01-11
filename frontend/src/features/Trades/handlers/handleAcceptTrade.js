// handleAcceptTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates }) {

  // Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_accepted_date: new Date().toISOString(), // Set accepted date to current time
    trade_status: 'pending',                        // Update status to 'pending'
    last_update: Date.now(),
  };

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data using setTradeData
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleAcceptTrade] Error persisting trade data:", error);
  }

  // Prepare batched update data
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };

  try {
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleAcceptTrade] Error in putBatchedTradeUpdates:", error);
  }

  periodicUpdates();
  console.log("[handleAcceptTrade] Completed.");
}

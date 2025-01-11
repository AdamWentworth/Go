// handleAcceptTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates }) {
  console.log("[handleAcceptTrade] Invoked with trade:", trade);
  console.log("[handleAcceptTrade] Current trades:", trades);

  // Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_accepted_date: new Date().toISOString(), // Set accepted date to current time
    trade_status: 'pending'                         // Update status to 'pending'
  };
  console.log("[handleAcceptTrade] Updated trade:", updatedTrade);

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };
  console.log("[handleAcceptTrade] Updated trades collection:", updatedTrades);

  // Persist the updated trades data using setTradeData
  try {
    await setTradeData(updatedTrades);
    console.log("[handleAcceptTrade] Trade data persisted successfully.");
  } catch (error) {
    console.error("[handleAcceptTrade] Error persisting trade data:", error);
  }

  // Prepare batched update data
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };
  console.log("[handleAcceptTrade] Batched update data prepared:", batchedUpdateData);

  // Use the same trade_id as the key to uniquely identify
  console.log("[handleAcceptTrade] Attempting to put data with key:", updatedTrade.trade_id);
  try {
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
    console.log("[handleAcceptTrade] putBatchedTradeUpdates succeeded.");
  } catch (error) {
    console.error("[handleAcceptTrade] Error in putBatchedTradeUpdates:", error);
  }

  // Call periodicUpdates to refresh data as needed
  console.log("[handleAcceptTrade] Calling periodicUpdates.");
  periodicUpdates();
  console.log("[handleAcceptTrade] Completed.");
}

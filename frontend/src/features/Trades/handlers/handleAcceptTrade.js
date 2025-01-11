// handleAcceptTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_accepted_date: new Date().toISOString(), // Set accepted date to current time
    trade_status: 'pending'                          // Update status to 'pending'
  };

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data using setTradeData
  await setTradeData(updatedTrades);

  // Prepare batched update data
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };

  // Use the same trade_id as the key to uniquely identify
  await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);

  // Call periodicUpdates to refresh data as needed
  periodicUpdates();
}

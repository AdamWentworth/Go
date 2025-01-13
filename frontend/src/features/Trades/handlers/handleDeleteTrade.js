// handleDeleteTrade.js
import { putBatchedTradeUpdates, deleteFromTradesDB } from "../../../services/indexedDB";

export async function handleDeleteTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // Create an updated trades object by removing the deleted trade
  const updatedTrades = { ...trades };
  delete updatedTrades[trade.trade_id];

  // Update state (and underlying IndexedDB via setTradeData) with the trade removed
  try {
    await setTradeData(updatedTrades);
    // Now explicitly remove the trade from IndexedDB
    await deleteFromTradesDB('pokemonTrades', trade.trade_id);
  } catch (error) {
    console.error("[handleDeleteTrade] Error persisting trade data:", error);
    return;
  }

  // Optionally, prepare a batched update to reflect the deletion on the server/backend
  const updatedTrade = {
    ...trade,
    trade_deleted_date: new Date().toISOString(),
    trade_status: 'deleted',
    last_update: Date.now(),
  };
  const batchedUpdateData = {
    operation: 'updateTrade', // or 'deleteTrade' if your backend expects a different operation
    tradeData: updatedTrade,
  };

  try {
    await putBatchedTradeUpdates(trade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleDeleteTrade] Error in putBatchedTradeUpdates:", error);
  }

  periodicUpdates();
  console.log("[handleDeleteTrade] Completed.");
}

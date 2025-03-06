// handleDeleteTrade.js
import { putBatchedTradeUpdates, deleteFromTradesDB } from "../../../services/indexedDB";

export async function handleDeleteTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // 1) Clone existing trades
  const updatedTrades = { ...trades };

  // 2) Mark the specific trade with "deleted" status
  updatedTrades[trade.trade_id] = {
    ...trade,
    trade_status: 'deleted',
    trade_deleted_date: new Date().toISOString(),
    last_update: Date.now(),
  };

  try {
    // 3) Let setTradeData see the 'deleted' status
    await setTradeData(updatedTrades);
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

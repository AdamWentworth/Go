// handleThumbUpTrade.js

import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleThumbsUpTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername }) {
  // Determine if the current user is the proposer (User 1) or accepter (User 2)
  const isCurrentUserProposer = (trade.username_proposed === currentUsername);

  // Toggle the appropriate satisfaction flag
  const updatedTrade = {
    ...trade,
    ...(isCurrentUserProposer
      ? { user_1_trade_satisfaction: !trade.user_1_trade_satisfaction }
      : { user_2_trade_satisfaction: !trade.user_2_trade_satisfaction }
    ),
    last_update: Date.now(),
  };

  // Update trades collection
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  try {
    await setTradeData(updatedTrades);

    // Optionally add batched update (if consistent with other handlers)
    const batchedUpdateData = {
      operation: 'updateTrade',
      tradeData: updatedTrade,
    };
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);

    periodicUpdates();
    console.log("[handleThumbsUp] Trade satisfaction updated.");
  } catch (error) {
    console.error("[handleThumbsUp] Error updating trade satisfaction:", error);
  }
}

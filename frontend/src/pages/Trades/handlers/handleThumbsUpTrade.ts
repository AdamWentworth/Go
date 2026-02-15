// handleThumbsUpTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('handleThumbsUpTrade');

interface Trade {
  trade_id: string;
  username_proposed: string;
  user_1_trade_satisfaction: boolean;
  user_2_trade_satisfaction: boolean;
  last_update: number;
  // Add additional fields as needed
}

interface HandleThumbsUpTradeArgs {
  trade: Trade;
  trades: { [trade_id: string]: Trade };
  setTradeData: (updatedTrades: { [trade_id: string]: Trade }) => Promise<void>;
  periodicUpdates: () => void;
  currentUsername: string;
}

export async function handleThumbsUpTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
  currentUsername,
}: HandleThumbsUpTradeArgs): Promise<void> {
  // Determine if the current user is the proposer (User 1) or accepter (User 2)
  const isCurrentUserProposer = trade.username_proposed === currentUsername;

  // Toggle the appropriate satisfaction flag and update last_update
  const updatedTrade: Trade = {
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
    log.debug('Trade satisfaction updated');
  } catch (error) {
    log.error('Error updating trade satisfaction', error);
  }
}

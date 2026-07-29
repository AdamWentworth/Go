import { updateTradeSatisfaction } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

type Trade = TradeRecord & {
  trade_id: string;
  username_proposed: string;
  user_1_trade_satisfaction: boolean;
  user_2_trade_satisfaction: boolean;
  last_update: number;
};

interface HandleThumbsUpTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
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
  const current = currentUsername === trade.username_proposed
    ? trade.user_1_trade_satisfaction
    : trade.user_2_trade_satisfaction;
  const response = await updateTradeSatisfaction(trade.trade_id, !current);
  await setTradeData({ ...trades, [trade.trade_id]: response.trade as Trade });
  periodicUpdates();
}

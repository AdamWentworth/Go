import { cancelTrade } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  trade_status: string;
  last_update: number;
};

export interface HandleCancelTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  currentUsername: string;
}

export async function handleCancelTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleCancelTradeArgs): Promise<void> {
  const response = await cancelTrade(trade.trade_id);
  await setTradeData({ ...trades, [trade.trade_id]: response.trade as Trade });
  periodicUpdates();
}

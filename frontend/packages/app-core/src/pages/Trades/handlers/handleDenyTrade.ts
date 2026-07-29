import { denyTrade } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  trade_status: string;
  last_update: number;
};

export interface HandleDenyTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

export async function handleDenyTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleDenyTradeArgs): Promise<void> {
  const response = await denyTrade(trade.trade_id);
  await setTradeData({ ...trades, [trade.trade_id]: response.trade as Trade });
  periodicUpdates();
}

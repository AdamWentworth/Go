import { removeTrade } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  trade_status: string;
  last_update: number;
};

export interface HandleDeleteTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

export async function handleDeleteTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleDeleteTradeArgs): Promise<void> {
  await removeTrade(trade.trade_id);
  await setTradeData({
    ...trades,
    [trade.trade_id]: { ...trade, trade_status: 'deleted' },
  });
  periodicUpdates();
}

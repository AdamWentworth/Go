import { reproposeTrade } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  username_proposed: string;
  username_accepting: string;
  trade_status: string;
  last_update: number;
};

export interface HandleReProposeTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  currentUsername: string;
}

export async function handleReProposeTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleReProposeTradeArgs): Promise<void> {
  const response = await reproposeTrade(trade.trade_id);
  await setTradeData({ ...trades, [trade.trade_id]: response.trade as Trade });
  periodicUpdates();
}

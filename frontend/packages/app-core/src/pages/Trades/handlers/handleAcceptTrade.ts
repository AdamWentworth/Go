import { acceptTrade } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  trade_status: string;
  last_update: number;
  pokemon_instance_id_user_accepting: string;
  pokemon_instance_id_user_proposed: string;
};

export interface HandleAcceptTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

export async function handleAcceptTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleAcceptTradeArgs): Promise<void> {
  const response = await acceptTrade(trade.trade_id);
  await setTradeData({ ...trades, [trade.trade_id]: response.trade as Trade });
  periodicUpdates();
}

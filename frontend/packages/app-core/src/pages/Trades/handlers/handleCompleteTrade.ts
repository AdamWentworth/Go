import { confirmTradeComplete } from '@/services/tradeService';
import type { TradeRecord } from '@shared-contracts/trades';

export type Trade = TradeRecord & {
  trade_id: string;
  username_proposed: string;
  username_accepting: string;
  trade_status: string;
  last_update: number;
  pokemon_instance_id_user_proposed: string;
  pokemon_instance_id_user_accepting: string;
};

export interface InstanceData {
  username: string;
  [key: string]: unknown;
}

export interface HandleCompleteTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  relatedInstances: Record<string, InstanceData>;
  instances: Record<string, InstanceData>;
  setInstances?: (updatedData: Record<string, InstanceData>) => void;
  currentUsername: string;
}

export async function handleCompleteTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
  setInstances,
}: HandleCompleteTradeArgs): Promise<Trade> {
  const response = await confirmTradeComplete(trade.trade_id);
  const updatedTrade = response.trade as Trade;
  await setTradeData({ ...trades, [trade.trade_id]: updatedTrade });
  if (Object.keys(response.affected_instances).length > 0) {
    setInstances?.(
      response.affected_instances as unknown as Record<string, InstanceData>,
    );
  }
  periodicUpdates();
  return updatedTrade;
}

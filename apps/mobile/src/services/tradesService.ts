import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import { fetchUserOverview } from './userOverviewService';

export type TradeStatusCount = Record<string, number>;

export type TradesOverview = {
  trades: TradeRecord[];
  statusCounts: TradeStatusCount;
};

const toTradeArray = (tradesMap: Record<string, TradeRecord>): TradeRecord[] =>
  Object.entries(tradesMap).map(([tradeId, trade]) => ({
    ...trade,
    trade_id: trade.trade_id ?? tradeId,
  }));

const sortByLastUpdateDesc = (trades: TradeRecord[]): TradeRecord[] =>
  trades.sort((a, b) => {
    const aRaw = a.last_update;
    const bRaw = b.last_update;
    const aTime =
      typeof aRaw === 'number'
        ? aRaw
        : typeof aRaw === 'string'
          ? new Date(aRaw).getTime()
          : 0;
    const bTime =
      typeof bRaw === 'number'
        ? bRaw
        : typeof bRaw === 'string'
          ? new Date(bRaw).getTime()
          : 0;
    return bTime - aTime;
  });

const groupByStatus = (trades: TradeRecord[]): TradeStatusCount =>
  trades.reduce<TradeStatusCount>((acc, trade) => {
    const key = typeof trade.trade_status === 'string' ? trade.trade_status : 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

export const fetchTradesOverviewForUser = async (
  userId: string,
): Promise<TradesOverview> => {
  const overview = await fetchUserOverview(userId);
  const trades = sortByLastUpdateDesc(toTradeArray(overview.trades ?? {}));
  return {
    trades,
    statusCounts: groupByStatus(trades),
  };
};


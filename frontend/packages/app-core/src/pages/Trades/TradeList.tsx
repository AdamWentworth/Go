import { useMemo } from 'react';

import TradeCard from '@/pages/Trades/TradeCard';

import type {
  RelatedInstancesMap,
  TradeListTrade,
  TradeMap,
  TradeStatusFilter,
} from './types';
import type { Instances } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { getStoredUsername } from '@/utils/storage';

import './TradeList.css';

interface TradeListProps {
  trades: TradeMap;
  relatedInstances: RelatedInstancesMap;
  selectedStatus: TradeStatusFilter;
  setInstances: (updatedData: Instances) => void | Promise<void>;
  variants: PokemonVariant[];
  instances?: Instances | null;
  loading: boolean;
  periodicUpdates: () => void;
}

type EnrichedTrade = TradeListTrade & { trade_id: string };

const normalizeStatus = (value: string | null | undefined): string =>
  String(value ?? '').toLowerCase();

function TradeList({
  trades,
  relatedInstances,
  selectedStatus,
  setInstances,
  variants,
  instances,
  loading,
  periodicUpdates,
}: TradeListProps) {
  const resolvedInstances = (instances ?? {}) as Instances;

  const currentUsername = useMemo(() => getStoredUsername(), []);

  const sortedTrades = useMemo<EnrichedTrade[]>(
    () =>
      Object.entries(trades ?? {})
        .map(([tradeId, trade]) => ({
          ...trade,
          trade_id: trade.trade_id ?? tradeId,
        }))
        .sort((a, b) => normalizeStatus(a.trade_status).localeCompare(normalizeStatus(b.trade_status))),
    [trades],
  );

  const filteredTrades = useMemo(() => {
    const normalizedSelectedStatus = selectedStatus.toLowerCase();

    if (normalizedSelectedStatus === 'proposed') {
      return sortedTrades.filter(
        (trade) =>
          normalizeStatus(trade.trade_status) === 'proposed' &&
          trade.username_proposed === currentUsername,
      );
    }

    if (normalizedSelectedStatus === 'accepting') {
      return sortedTrades.filter(
        (trade) =>
          normalizeStatus(trade.trade_status) === 'proposed' &&
          trade.username_accepting === currentUsername,
      );
    }

    return sortedTrades.filter(
      (trade) => normalizeStatus(trade.trade_status) === normalizedSelectedStatus,
    );
  }, [currentUsername, selectedStatus, sortedTrades]);

  return (
    <div className="trades-list">
      {filteredTrades.length === 0 ? (
        <p>No trades found for status: {selectedStatus}</p>
      ) : (
        filteredTrades.map((trade, index) => (
          <TradeCard
            key={trade.trade_id ? `${trade.trade_id}_${index}` : `trade_${index}`}
            trade={trade}
            relatedInstances={relatedInstances}
            selectedStatus={selectedStatus}
            setInstances={setInstances}
            variants={variants}
            instances={resolvedInstances}
            loading={loading}
            periodicUpdates={periodicUpdates}
          />
        ))
      )}
    </div>
  );
}

export default TradeList;

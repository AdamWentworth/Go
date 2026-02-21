import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import {
  acceptTrade,
  buildStatusCounts,
  cancelTrade,
  completeTrade,
  deleteTrade,
  denyTrade,
  reproposeTrade,
  toTradeMap,
  toTradeRows,
  type TradeRow,
} from '../features/trades/tradeMutations';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { sendTradeUpdate } from '../services/receiverService';
import { fetchTradesOverviewForUser } from '../services/tradesService';

type TradesScreenProps = NativeStackScreenProps<RootStackParamList, 'Trades'>;

const MAX_ROWS = 80;

export const TradesScreen = ({ navigation }: TradesScreenProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  const loadTrades = async () => {
    setLoading(true);
    setError(null);
    setTrades([]);
    setStatusCounts({});
    try {
      if (!user?.user_id) {
        setError('You must be authenticated to load trades.');
        return;
      }
      const payload = await fetchTradesOverviewForUser(user.user_id);
      const normalizedRows = payload.trades.map((row) => ({
        ...row,
        trade_id: String(row.trade_id ?? ''),
        trade_status: String(row.trade_status ?? ''),
      })) as TradeRow[];
      setTrades(normalizedRows);
      setStatusCounts(buildStatusCounts(normalizedRows));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load trades.');
    } finally {
      setLoading(false);
    }
  };

  const visibleTrades = useMemo(() => trades.slice(0, MAX_ROWS), [trades]);
  const statusEntries = useMemo(() => Object.entries(statusCounts).sort(), [statusCounts]);
  const selectedTrade = useMemo(
    () => trades.find((trade) => trade.trade_id === selectedTradeId) ?? null,
    [trades, selectedTradeId],
  );

  const syncMutation = async (rows: TradeRow[]) => {
    for (const row of rows) {
      await sendTradeUpdate({
        operation: 'updateTrade',
        tradeData: row,
      });
    }
  };

  const runMutation = async (
    mutate: (tradeMap: ReturnType<typeof toTradeMap>) => {
      next: ReturnType<typeof toTradeMap>;
      changed: TradeRow[];
    },
  ) => {
    if (!selectedTradeId) return;
    const currentMap = toTradeMap(trades);
    const { next, changed } = mutate(currentMap);
    const nextRows = toTradeRows(next);
    setTrades(nextRows);
    setStatusCounts(buildStatusCounts(nextRows));
    try {
      await syncMutation(changed);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to sync trade update.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Trades</Text>
      <Text style={styles.subtitle}>Read-only mobile baseline for trade overview</Text>

      <View style={styles.actions}>
        <Button title={loading ? 'Loading...' : 'Load Trades'} onPress={() => void loadTrades()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {statusEntries.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status Summary</Text>
          {statusEntries.map(([status, count]) => (
            <Text key={status} style={styles.caption}>
              {status}: {count}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.caption}>
        Showing {visibleTrades.length} of {trades.length} trades.
      </Text>

      {visibleTrades.map((trade) => (
        <Pressable
          key={String(trade.trade_id)}
          onPress={() => setSelectedTradeId(trade.trade_id ?? null)}
          style={[styles.tradeRow, selectedTradeId === trade.trade_id ? styles.tradeRowSelected : null]}
        >
          <Text style={styles.tradePrimary}>{trade.trade_status} - {trade.trade_id}</Text>
          <Text style={styles.tradeSecondary}>
            {trade.username_proposed ?? '-'}
            {' -> '}
            {trade.username_accepting ?? '-'}
          </Text>
          <Text style={styles.tradeSecondary}>
            {trade.pokemon_instance_id_user_proposed ?? '-'} /{' '}
            {trade.pokemon_instance_id_user_accepting ?? '-'}
          </Text>
        </Pressable>
      ))}

      {selectedTrade ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trade Actions ({selectedTrade.trade_id})</Text>
          <View style={styles.actions}>
            <Button
              title="Accept"
              onPress={() => void runMutation((map) => acceptTrade(map, selectedTrade.trade_id))}
            />
            <Button
              title="Deny"
              onPress={() => void runMutation((map) => denyTrade(map, selectedTrade.trade_id))}
            />
            <Button
              title="Cancel"
              onPress={() =>
                void runMutation((map) =>
                  cancelTrade(map, selectedTrade.trade_id, user?.username ?? 'unknown'),
                )
              }
            />
            <Button
              title="Complete"
              onPress={() =>
                void runMutation((map) => completeTrade(map, selectedTrade.trade_id, user?.username ?? ''))
              }
            />
            <Button
              title="Re-Propose"
              onPress={() =>
                void runMutation((map) => reproposeTrade(map, selectedTrade.trade_id, user?.username ?? ''))
              }
            />
            <Button
              title="Delete"
              onPress={() => void runMutation((map) => deleteTrade(map, selectedTrade.trade_id))}
            />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  actions: {
    gap: 8,
  },
  error: {
    color: '#b00020',
  },
  caption: {
    color: '#374151',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tradeRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    gap: 2,
  },
  tradeRowSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  tradePrimary: {
    fontWeight: '600',
  },
  tradeSecondary: {
    color: '#6b7280',
    fontSize: 12,
  },
});

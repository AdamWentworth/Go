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
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type TradesScreenProps = NativeStackScreenProps<RootStackParamList, 'Trades'>;

const MAX_ROWS = 80;

export const TradesScreen = ({ navigation }: TradesScreenProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

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
    if (!selectedTradeId || mutationLoading) return;
    setMutationLoading(true);
    const currentMap = toTradeMap(trades);
    const { next, changed } = mutate(currentMap);
    const nextRows = toTradeRows(next);
    setTrades(nextRows);
    setStatusCounts(buildStatusCounts(nextRows));
    try {
      await syncMutation(changed);
      await loadTrades();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to sync trade update.');
      await loadTrades();
    } finally {
      setMutationLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Trades</Text>
      <Text style={commonStyles.subtitle}>Trade overview + mutation baseline</Text>

      <View style={commonStyles.actions}>
        <Button
          title={loading ? 'Loading...' : 'Load Trades'}
          onPress={() => void loadTrades()}
          disabled={mutationLoading}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {error ? <Text style={commonStyles.error}>{error}</Text> : null}

      {statusEntries.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Status Summary</Text>
          {statusEntries.map(([status, count]) => (
            <Text key={status} style={commonStyles.caption}>
              {status}: {count}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={commonStyles.caption}>
        Showing {visibleTrades.length} of {trades.length} trades.
      </Text>
      {mutationLoading ? <Text style={commonStyles.caption}>Syncing trade update...</Text> : null}

      {visibleTrades.map((trade) => (
        <Pressable
          key={String(trade.trade_id)}
          onPress={() => setSelectedTradeId(trade.trade_id ?? null)}
          style={[commonStyles.row, selectedTradeId === trade.trade_id ? commonStyles.rowSelected : null]}
        >
          <Text style={commonStyles.rowTitle}>{trade.trade_status} - {trade.trade_id}</Text>
          <Text style={commonStyles.rowSub}>
            {trade.username_proposed ?? '-'}
            {' -> '}
            {trade.username_accepting ?? '-'}
          </Text>
          <Text style={commonStyles.rowSub}>
            {trade.pokemon_instance_id_user_proposed ?? '-'} /{' '}
            {trade.pokemon_instance_id_user_accepting ?? '-'}
          </Text>
        </Pressable>
      ))}

      {selectedTrade ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Trade Actions ({selectedTrade.trade_id})</Text>
          <View style={commonStyles.actions}>
            <Button
              title="Accept"
              disabled={mutationLoading}
              onPress={() => void runMutation((map) => acceptTrade(map, selectedTrade.trade_id))}
            />
            <Button
              title="Deny"
              disabled={mutationLoading}
              onPress={() => void runMutation((map) => denyTrade(map, selectedTrade.trade_id))}
            />
            <Button
              title="Cancel"
              disabled={mutationLoading}
              onPress={() =>
                void runMutation((map) =>
                  cancelTrade(map, selectedTrade.trade_id, user?.username ?? 'unknown'),
                )
              }
            />
            <Button
              title="Complete"
              disabled={mutationLoading}
              onPress={() =>
                void runMutation((map) => completeTrade(map, selectedTrade.trade_id, user?.username ?? ''))
              }
            />
            <Button
              title="Re-Propose"
              disabled={mutationLoading}
              onPress={() =>
                void runMutation((map) => reproposeTrade(map, selectedTrade.trade_id, user?.username ?? ''))
              }
            />
            <Button
              title="Delete"
              disabled={mutationLoading}
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
    ...commonStyles.screenContainer,
    backgroundColor: theme.colors.background,
  },
});

import React, { useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchTradesOverviewForUser } from '../services/tradesService';

type TradesScreenProps = NativeStackScreenProps<RootStackParamList, 'Trades'>;

const MAX_ROWS = 80;

export const TradesScreen = ({ navigation }: TradesScreenProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<{
    trade_id?: string;
    trade_status: string;
    username_proposed?: string | null;
    username_accepting?: string | null;
    pokemon_instance_id_user_proposed?: string | null;
    pokemon_instance_id_user_accepting?: string | null;
    last_update?: string | number | null;
  }[]>([]);

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
      setTrades(payload.trades);
      setStatusCounts(payload.statusCounts);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load trades.');
    } finally {
      setLoading(false);
    }
  };

  const visibleTrades = useMemo(() => trades.slice(0, MAX_ROWS), [trades]);
  const statusEntries = useMemo(() => Object.entries(statusCounts).sort(), [statusCounts]);

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
        <View key={String(trade.trade_id)} style={styles.tradeRow}>
          <Text style={styles.tradePrimary}>
            {trade.trade_status} • {trade.trade_id}
          </Text>
          <Text style={styles.tradeSecondary}>
            {trade.username_proposed ?? '-'} → {trade.username_accepting ?? '-'}
          </Text>
          <Text style={styles.tradeSecondary}>
            {trade.pokemon_instance_id_user_proposed ?? '-'} /{' '}
            {trade.pokemon_instance_id_user_accepting ?? '-'}
          </Text>
        </View>
      ))}
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
  tradePrimary: {
    fontWeight: '600',
  },
  tradeSecondary: {
    color: '#6b7280',
    fontSize: 12,
  },
});

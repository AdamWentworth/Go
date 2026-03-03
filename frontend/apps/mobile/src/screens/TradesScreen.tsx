import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PartnerInfo } from '@pokemongonexus/shared-contracts/trades';
import { useAuth } from '../features/auth/AuthProvider';
import { useEvents } from '../features/events/EventsProvider';
import {
  acceptTrade,
  buildStatusCounts,
  cancelTrade,
  completeTrade,
  deleteTrade,
  denyTrade,
  reproposeTrade,
  setTradeSatisfaction,
  toTradeMap,
  toTradeRows,
  type TradeMap,
  type TradeRow,
} from '../features/trades/tradeMutations';
import {
  buildAllowedActionLabel,
  buildUnavailableTradeActionHints,
  evaluateTradeAction,
  type TradeAction,
} from '../features/trades/tradeActionRules';
import {
  buildTradeAuditDetails,
  buildTradeActionConfirmation,
  buildTradeStatusDetail,
} from '../features/trades/tradeLifecycleMessages';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { sendTradeUpdate } from '../services/receiverService';
import { revealTradePartnerInfo } from '../services/tradePartnerService';
import { fetchTradesOverviewForUser } from '../services/tradesService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type TradesScreenProps = NativeStackScreenProps<RootStackParamList, 'Trades'>;
type TradeMutationResult = { next: TradeMap; changed: TradeRow[] };
type TradeMutation = (tradeMap: TradeMap) => TradeMutationResult;
type SyncState = 'idle' | 'success' | 'failed';

const MAX_ROWS = 80;
const STATUS_FILTER_ALL = 'all';
const STATUS_FILTER_PRIORITY = ['proposed', 'pending', 'completed', 'cancelled', 'denied', 'deleted'];
const EVENT_REFRESH_COOLDOWN_MS = 1500;

const normalizeStatus = (status: unknown): string =>
  typeof status === 'string' ? status.trim().toLowerCase() : '';

const compareStatusLabel = (left: string, right: string): number => {
  const leftRank = STATUS_FILTER_PRIORITY.indexOf(left);
  const rightRank = STATUS_FILTER_PRIORITY.indexOf(right);
  if (leftRank >= 0 && rightRank >= 0) return leftRank - rightRank;
  if (leftRank >= 0) return -1;
  if (rightRank >= 0) return 1;
  return left.localeCompare(right);
};

const formatSatisfaction = (value: unknown): string => {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return 'not rated';
};

const formatPartnerValue = (value: unknown): string => {
  if (typeof value !== 'string') return '-';
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : '-';
};

export const TradesScreen = ({ navigation }: TradesScreenProps) => {
  const { user } = useAuth();
  const { eventVersion, latestUpdate, syncing: eventsSyncing } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [retryMutation, setRetryMutation] = useState<TradeMutation | null>(null);
  const [revealingTradeId, setRevealingTradeId] = useState<string | null>(null);
  const [partnerRevealError, setPartnerRevealError] = useState<string | null>(null);
  const [revealedPartners, setRevealedPartners] = useState<Record<string, PartnerInfo>>({});
  const lastEventRefreshAtRef = useRef(0);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setSelectedTradeId((current) =>
        normalizedRows.some((row) => row.trade_id === current) ? current : null,
      );
      setStatusFilter((current) => {
        if (current === STATUS_FILTER_ALL) return current;
        const hasRowsForFilter = normalizedRows.some(
          (row) => normalizeStatus(row.trade_status) === current,
        );
        return hasRowsForFilter ? current : STATUS_FILTER_ALL;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load trades.');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (eventVersion === 0) return;
    if (!latestUpdate) return;
    if (Object.keys(latestUpdate.trade).length === 0) return;
    if (loading || mutationLoading || eventsSyncing) return;
    const now = Date.now();
    if (now - lastEventRefreshAtRef.current < EVENT_REFRESH_COOLDOWN_MS) return;
    lastEventRefreshAtRef.current = now;
    void loadTrades();
  }, [eventVersion, latestUpdate, loading, mutationLoading, eventsSyncing, loadTrades]);

  const filteredTrades = useMemo(() => {
    if (statusFilter === STATUS_FILTER_ALL) return trades;
    return trades.filter((trade) => normalizeStatus(trade.trade_status) === statusFilter);
  }, [statusFilter, trades]);

  const visibleTrades = useMemo(() => filteredTrades.slice(0, MAX_ROWS), [filteredTrades]);
  const statusEntries = useMemo(() => Object.entries(statusCounts).sort(), [statusCounts]);
  const statusFilterOptions = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(
        Object.keys(statusCounts)
          .map((status) => normalizeStatus(status))
          .filter((status) => status.length > 0),
      ),
    ).sort(compareStatusLabel);
    return [STATUS_FILTER_ALL, ...uniqueStatuses];
  }, [statusCounts]);

  const selectedTrade = useMemo(
    () => trades.find((trade) => trade.trade_id === selectedTradeId) ?? null,
    [trades, selectedTradeId],
  );
  const selectedTradeStatusDetail = useMemo(
    () => buildTradeStatusDetail(selectedTrade, user?.username ?? ''),
    [selectedTrade, user?.username],
  );
  const selectedTradeAuditDetails = useMemo(
    () => buildTradeAuditDetails(selectedTrade),
    [selectedTrade],
  );
  const selectedPartnerInfo = useMemo(
    () => (selectedTrade ? (revealedPartners[selectedTrade.trade_id] ?? null) : null),
    [revealedPartners, selectedTrade],
  );
  const selectedViewerSatisfaction = useMemo(() => {
    if (!selectedTrade || !user?.username) return 'not available';
    if (user.username === selectedTrade.username_proposed) {
      return formatSatisfaction(selectedTrade.user_1_trade_satisfaction);
    }
    if (user.username === selectedTrade.username_accepting) {
      return formatSatisfaction(selectedTrade.user_2_trade_satisfaction);
    }
    return 'not available';
  }, [selectedTrade, user?.username]);

  const canRevealPartnerInfo = useMemo(() => {
    if (!selectedTrade || !user?.username) return false;
    const status = normalizeStatus(selectedTrade.trade_status);
    const isParticipant =
      user.username === (selectedTrade.username_proposed ?? '') ||
      user.username === (selectedTrade.username_accepting ?? '');
    return isParticipant && (status === 'pending' || status === 'completed');
  }, [selectedTrade, user?.username]);

  const actionDecisions = useMemo(() => {
    if (!selectedTrade) return null;
    const context = {
      viewerUsername: user?.username ?? null,
      trade: selectedTrade,
    };
    return {
      accept: evaluateTradeAction(selectedTrade.trade_status, 'accept', context),
      deny: evaluateTradeAction(selectedTrade.trade_status, 'deny', context),
      cancel: evaluateTradeAction(selectedTrade.trade_status, 'cancel', context),
      complete: evaluateTradeAction(selectedTrade.trade_status, 'complete', context),
      repropose: evaluateTradeAction(selectedTrade.trade_status, 'repropose', context),
      delete: evaluateTradeAction(selectedTrade.trade_status, 'delete', context),
      satisfaction: evaluateTradeAction(selectedTrade.trade_status, 'satisfaction', context),
      unavailableHints: buildUnavailableTradeActionHints(selectedTrade.trade_status, context),
    };
  }, [selectedTrade, user?.username]);

  const syncMutation = async (rows: TradeRow[]) => {
    for (const row of rows) {
      await sendTradeUpdate({
        operation: 'updateTrade',
        tradeData: row,
      });
    }
  };

  const runMutation = async (mutate: TradeMutation) => {
    if (!selectedTradeId || mutationLoading) return;
    setMutationLoading(true);
    setError(null);
    setSyncError(null);
    const currentMap = toTradeMap(trades);
    const { next, changed } = mutate(currentMap);
    const nextRows = toTradeRows(next);
    setTrades(nextRows);
    setStatusCounts(buildStatusCounts(nextRows));
    try {
      await syncMutation(changed);
      setSyncState('success');
      setRetryMutation(null);
      await loadTrades();
    } catch (nextError) {
      setSyncState('failed');
      setRetryMutation(() => mutate);
      setSyncError(
        nextError instanceof Error
          ? `Trade update failed to sync: ${nextError.message}`
          : 'Trade update failed to sync.',
      );
      await loadTrades();
    } finally {
      setMutationLoading(false);
    }
  };

  const confirmAndRunMutation = (action: TradeAction, mutate: TradeMutation) => {
    if (!selectedTrade || mutationLoading) return;
    const content = buildTradeActionConfirmation(action, selectedTrade, user?.username ?? '');
    Alert.alert(content.title, content.message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: () => {
          void runMutation(mutate);
        },
      },
    ]);
  };

  const revealPartner = async () => {
    if (!selectedTrade || revealingTradeId || mutationLoading) return;
    setPartnerRevealError(null);
    setRevealingTradeId(selectedTrade.trade_id);
    try {
      const partnerInfo = await revealTradePartnerInfo(selectedTrade);
      setRevealedPartners((current) => ({
        ...current,
        [selectedTrade.trade_id]: partnerInfo,
      }));
    } catch (nextError) {
      setPartnerRevealError(
        nextError instanceof Error ? nextError.message : 'Failed to reveal partner info.',
      );
    } finally {
      setRevealingTradeId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Trades</Text>
      <Text style={commonStyles.subtitle}>Trade overview + mutation baseline</Text>

      <View style={commonStyles.actions}>
        <Button
          title={loading ? 'Loading...' : 'Load Trades'}
          onPress={() => {
            setSyncError(null);
            setPartnerRevealError(null);
            void loadTrades();
          }}
          disabled={mutationLoading}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
      {syncError ? <Text style={commonStyles.error}>{syncError}</Text> : null}

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

      <View style={commonStyles.card}>
        <Text style={commonStyles.cardTitle}>Status Views</Text>
        <View style={styles.statusPillWrap}>
          {statusFilterOptions.map((status) => {
            const selected = statusFilter === status;
            const count = status === STATUS_FILTER_ALL ? trades.length : statusCounts[status] ?? 0;
            const label = `${status} (${count})`;
            return (
              <Pressable
                key={status}
                testID={`status-filter-${status}`}
                onPress={() => setStatusFilter(status)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={commonStyles.caption}>
        Showing {visibleTrades.length} of {filteredTrades.length}{' '}
        {statusFilter === STATUS_FILTER_ALL ? 'trades' : `${statusFilter} trades`}.
      </Text>
      {mutationLoading ? <Text style={commonStyles.caption}>Syncing trade update...</Text> : null}
      <Text style={commonStyles.caption}>Last sync: {syncState}</Text>
      {retryMutation ? (
        <View style={commonStyles.actions}>
          <Button
            title="Retry Last Update"
            disabled={mutationLoading}
            onPress={() => void runMutation(retryMutation)}
          />
        </View>
      ) : null}
      {filteredTrades.length === 0 && !loading ? (
        <Text style={commonStyles.hint}>
          No trades found for the current status view.
        </Text>
      ) : null}

      {visibleTrades.map((trade) => (
        <Pressable
          key={String(trade.trade_id)}
          onPress={() => setSelectedTradeId(trade.trade_id ?? null)}
          style={[commonStyles.row, selectedTradeId === trade.trade_id ? commonStyles.rowSelected : null]}
        >
          <Text style={commonStyles.rowTitle}>
            {trade.trade_status} - {trade.trade_id}
          </Text>
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
          <Text style={commonStyles.caption}>{buildAllowedActionLabel(selectedTrade.trade_status)}</Text>
          <Text style={commonStyles.caption}>Your satisfaction: {selectedViewerSatisfaction}</Text>
          <Text style={commonStyles.hint}>{selectedTradeStatusDetail}</Text>
          {(actionDecisions?.unavailableHints ?? []).map((hint) => (
            <Text key={hint} style={commonStyles.hint}>
              {hint}
            </Text>
          ))}
          {selectedTradeAuditDetails.map((line) => (
            <Text key={line} style={commonStyles.caption}>
              {line}
            </Text>
          ))}
          <View style={commonStyles.actions}>
            <Button
              title="Accept"
              disabled={mutationLoading || !Boolean(actionDecisions?.accept.allowed)}
              onPress={() =>
                confirmAndRunMutation('accept', (map) => acceptTrade(map, selectedTrade.trade_id))
              }
            />
            <Button
              title="Deny"
              disabled={mutationLoading || !Boolean(actionDecisions?.deny.allowed)}
              onPress={() =>
                confirmAndRunMutation('deny', (map) => denyTrade(map, selectedTrade.trade_id))
              }
            />
            <Button
              title="Cancel"
              disabled={mutationLoading || !Boolean(actionDecisions?.cancel.allowed)}
              onPress={() =>
                confirmAndRunMutation('cancel', (map) =>
                  cancelTrade(map, selectedTrade.trade_id, user?.username ?? 'unknown'),
                )
              }
            />
            <Button
              title="Complete"
              disabled={mutationLoading || !Boolean(actionDecisions?.complete.allowed)}
              onPress={() =>
                confirmAndRunMutation('complete', (map) =>
                  completeTrade(map, selectedTrade.trade_id, user?.username ?? ''),
                )
              }
            />
            <Button
              title="Toggle Satisfaction"
              disabled={mutationLoading || !Boolean(actionDecisions?.satisfaction.allowed)}
              onPress={() =>
                confirmAndRunMutation('satisfaction', (map) =>
                  setTradeSatisfaction(map, selectedTrade.trade_id, user?.username ?? ''),
                )
              }
            />
            <Button
              title="Re-Propose"
              disabled={mutationLoading || !Boolean(actionDecisions?.repropose.allowed)}
              onPress={() =>
                confirmAndRunMutation('repropose', (map) =>
                  reproposeTrade(map, selectedTrade.trade_id, user?.username ?? ''),
                )
              }
            />
            <Button
              title="Delete"
              disabled={mutationLoading || !Boolean(actionDecisions?.delete.allowed)}
              onPress={() =>
                confirmAndRunMutation('delete', (map) => deleteTrade(map, selectedTrade.trade_id))
              }
            />
          </View>

          {canRevealPartnerInfo ? (
            <View style={commonStyles.actions}>
              <Button
                title={revealingTradeId === selectedTrade.trade_id ? 'Revealing...' : 'Reveal Partner Info'}
                disabled={mutationLoading || revealingTradeId === selectedTrade.trade_id}
                onPress={() => void revealPartner()}
              />
              {partnerRevealError ? <Text style={commonStyles.error}>{partnerRevealError}</Text> : null}
              {selectedPartnerInfo ? (
                <View style={styles.partnerCard}>
                  <Text style={commonStyles.caption}>
                    Trainer: {formatPartnerValue(selectedPartnerInfo.pokemonGoName)}
                  </Text>
                  <Text style={commonStyles.caption}>
                    Code: {formatPartnerValue(selectedPartnerInfo.trainerCode)}
                  </Text>
                  <Text style={commonStyles.caption}>
                    Location: {formatPartnerValue(selectedPartnerInfo.location)}
                  </Text>
                  <Text style={commonStyles.caption}>
                    Coordinates: {selectedPartnerInfo.coordinates
                      ? `${String(selectedPartnerInfo.coordinates.latitude)}, ${String(selectedPartnerInfo.coordinates.longitude)}`
                      : '-'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
  statusPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  partnerCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    gap: 2,
  },
});

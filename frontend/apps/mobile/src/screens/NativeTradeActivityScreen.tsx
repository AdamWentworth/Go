import type { PartnerInfo } from '@pokemongonexus/shared-contracts/trades';
import {
  TRADE_ACTIVITY_FILTERS,
  type TradeActivityFilter,
} from '@pokemongonexus/shared-domain/trade-activity';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMemo, useRef, useState } from 'react';
import {
  NativePokemonLocationBackdrop,
} from '../features/collection/parity/NativePokemonLocationBackdrop';
import type { NativeInstanceDetail } from '../features/collection/collectionModel';
import type { NativeTradeActivityRow } from '../features/trades/nativeTradeActivityRows';
import type {
  NativeTradeActivityActionModel,
  NativeTradeActivityModel,
} from '../features/trades/nativeTradeActivityModel';
import { useNativeModalAnimation } from '../features/settings/useNativeMotion';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { NativeUiIcon } from '../components/NativeUiIcon';

type Props = {
  assetBaseUrl: string;
  error: string | null;
  isLoading: boolean;
  onAction: (
    model: NativeTradeActivityModel,
    action: Exclude<NativeTradeActivityActionModel['action'], 'coordinate'>,
  ) => Promise<void>;
  onOpenPreferences: () => void;
  onRetry: () => void;
  onRevealPartner: (tradeId: string) => Promise<PartnerInfo>;
  rows: NativeTradeActivityRow[];
  showModeTabs?: boolean;
};

const FILTER_LABELS: Record<TradeActivityFilter, { full: string; compact: string }> = {
  Accepting: { full: 'Needs response', compact: 'Offers' },
  Proposed: { full: 'Sent', compact: 'Sent' },
  Pending: { full: 'Active', compact: 'Active' },
  Completed: { full: 'Completed', compact: 'Done' },
  Cancelled: { full: 'Closed', compact: 'Closed' },
};

const FILTER_TONES: Record<TradeActivityFilter, { border: string; surface: string; accent: string }> = {
  Accepting: { border: '#a44d57', surface: '#3a2226', accent: '#dd5260' },
  Proposed: { border: '#34794b', surface: '#173223', accent: '#3aa85f' },
  Pending: { border: '#966b35', surface: '#392a18', accent: '#e39a3b' },
  Completed: { border: '#376da8', surface: '#192b41', accent: '#438de0' },
  Cancelled: { border: '#5e686c', surface: '#272e31', accent: '#808c91' },
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const formatDate = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

const confirmationCopy = (
  action: Exclude<NativeTradeActivityActionModel['action'], 'coordinate'>,
): { title: string; body: string; confirm: string } => {
  switch (action) {
    case 'accept':
      return {
        title: 'Accept this offer?',
        body: 'The trade becomes active and coordination details may become available.',
        confirm: 'Accept offer',
      };
    case 'deny':
      return {
        title: 'Deny this offer?',
        body: 'This closes the proposal without changing either Pokémon.',
        confirm: 'Deny offer',
      };
    case 'cancel':
      return {
        title: 'Cancel this trade?',
        body: 'The proposal or active trade will move to Closed.',
        confirm: 'Cancel trade',
      };
    case 'complete':
      return {
        title: 'Confirm the exchange happened?',
        body: 'Only confirm after the Pokémon Go trade is complete. Both trainers must confirm before ownership changes here.',
        confirm: 'Confirm complete',
      };
    case 'repropose':
      return {
        title: 'Re-propose this trade?',
        body: 'The server will revalidate both Pokémon before sending a new proposal.',
        confirm: 'Re-propose',
      };
    case 'satisfy':
      return {
        title: 'Mark this trade as satisfying?',
        body: 'Your feedback is stored only for this completed exchange.',
        confirm: 'Save feedback',
      };
    case 'delete':
      return {
        title: 'Remove this trade from history?',
        body: 'This removes the terminal record from your visible history and cannot be undone.',
        confirm: 'Remove trade',
      };
  }
};

const PokemonCard = ({
  assetBaseUrl,
  detail,
  isLuckyTrade,
  label,
  light,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail | null;
  isLuckyTrade: boolean;
  label: string;
  light: boolean;
}) => (
  <View style={[styles.pokemonCard, light && styles.surfaceLight]}>
    <Text maxFontSizeMultiplier={1.25} numberOfLines={2} style={styles.partyLabel}>
      {label}
    </Text>
    <View style={styles.pokemonStage}>
      {detail?.row.locationBackgroundUri ? (
        <NativePokemonLocationBackdrop uri={detail.row.locationBackgroundUri} />
      ) : null}
      {isLuckyTrade ? (
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
          style={styles.luckyBackdrop}
        />
      ) : null}
      {detail?.row.imageUri ? (
        <Image
          accessibilityLabel={detail.row.name}
          resizeMode="contain"
          source={{ uri: detail.row.imageUri }}
          style={styles.pokemonImage}
        />
      ) : (
        <Text style={[styles.missingPokemon, light && styles.secondaryLight]}>No image</Text>
      )}
      {detail?.row.maxKind ? (
        <Image
          accessibilityLabel={detail.row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, `/images/${detail.row.maxKind}.png`) }}
          style={styles.maxBadge}
        />
      ) : null}
    </View>
    <Text
      maxFontSizeMultiplier={1.25}
      numberOfLines={3}
      style={[styles.pokemonName, light && styles.textLight]}
    >
      {detail?.row.name ?? 'Unknown Pokémon'}
    </Text>
  </View>
);

const TradeConditions = ({
  assetBaseUrl,
  model,
  light,
}: {
  assetBaseUrl: string;
  model: NativeTradeActivityModel;
  light: boolean;
}) => (
  <View style={[styles.conditions, light && styles.conditionsLight]}>
    <View style={styles.friendshipGroup}>
      <Text style={styles.conditionLabel}>FRIENDSHIP</Text>
      <View
        accessibilityLabel={`${model.friendshipLevel} of 5 friendship hearts${model.isRemoteTrade ? ', remote trade available' : ''}`}
        style={styles.conditionIcons}
      >
        <View style={styles.hearts}>
          {[1, 2, 3, 4, 5].map((level) => (
            <Image
              accessibilityElementsHidden
              key={level}
              resizeMode="contain"
              source={{
                uri: toAssetUrl(
                  assetBaseUrl,
                  `/images/${level <= model.friendshipLevel ? 'heart-filled' : 'heart-unfilled'}.png`,
                ),
              }}
              style={styles.heart}
            />
          ))}
        </View>
        <View style={styles.conditionIconTile}>
          <Image
            accessibilityLabel={model.isLuckyTrade ? 'Lucky trade' : 'Not a Lucky trade'}
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky_friend_icon.png') }}
            style={[styles.conditionIcon, !model.isLuckyTrade && styles.inactive]}
          />
        </View>
        <View style={styles.conditionIconTile}>
          <Image
            accessibilityLabel={model.isRemoteTrade ? 'Remote trade available' : 'Remote trade unavailable'}
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/remote_trade_icon.png') }}
            style={[styles.conditionIcon, !model.isRemoteTrade && styles.inactive]}
          />
        </View>
      </View>
    </View>
    <View style={styles.costGroup}>
      <Text style={styles.conditionLabel}>STARDUST</Text>
      <View style={styles.costValue}>
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/stardust.png') }}
          style={styles.stardust}
        />
        <Text maxFontSizeMultiplier={1.2} style={[styles.costText, light && styles.textLight]}>
          {model.stardustCost?.toLocaleString() ?? '—'}
        </Text>
      </View>
    </View>
  </View>
);

const TradeCard = ({
  assetBaseUrl,
  light,
  onRequestAction,
  onRevealPartner,
  row,
  workingAction,
}: {
  assetBaseUrl: string;
  light: boolean;
  onRequestAction: (
    row: NativeTradeActivityRow,
    action: Exclude<NativeTradeActivityActionModel['action'], 'coordinate'>,
  ) => void;
  onRevealPartner: (row: NativeTradeActivityRow) => void;
  row: NativeTradeActivityRow;
  workingAction: string | null;
}) => {
  const { model } = row;
  return (
    <View style={[styles.tradeCard, light && styles.cardLight]} testID={`trade-card-${model.tradeId}`}>
      <View style={styles.tradeHeader}>
        <View style={styles.tradeHeaderCopy}>
          <Text style={styles.statusLabel}>{model.label.toLocaleUpperCase()}</Text>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={2} style={[styles.tradeTitle, light && styles.textLight]}>
            {model.title}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={[styles.tradeDescription, light && styles.secondaryLight]}>
            {model.description}
          </Text>
        </View>
        <Text style={[styles.date, light && styles.secondaryLight]}>{formatDate(model.displayTimestamp)}</Text>
      </View>

      <View style={styles.exchange}>
        <PokemonCard
          assetBaseUrl={assetBaseUrl}
          detail={row.currentUserPokemon}
          isLuckyTrade={model.isLuckyTrade}
          label="YOU OFFER"
          light={light}
        />
        <View style={styles.exchangeIconWrap}>
          <Image
            accessibilityLabel="Trade exchange"
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/pogo_trade_icon.png') }}
            style={styles.exchangeIcon}
          />
        </View>
        <PokemonCard
          assetBaseUrl={assetBaseUrl}
          detail={row.partnerPokemon}
          isLuckyTrade={model.isLuckyTrade}
          label={`${model.partnerUsername.toLocaleUpperCase()} OFFERS`}
          light={light}
        />
      </View>

      <TradeConditions assetBaseUrl={assetBaseUrl} light={light} model={model} />
      <View style={styles.actions}>
        {model.actions.map((action) => {
          const actionKey = `${model.tradeId}:${action.action}`;
          const disabled = workingAction !== null;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              key={action.action}
              onPress={() => action.action === 'coordinate'
                ? onRevealPartner(row)
                : onRequestAction(row, action.action)}
              style={({ pressed }) => [
                styles.actionButton,
                action.tone === 'primary' && styles.primaryAction,
                action.tone === 'secondary' && styles.secondaryAction,
                action.tone === 'destructive' && styles.destructiveAction,
                pressed && !disabled && styles.pressed,
                disabled && styles.disabled,
              ]}
              testID={`trade-action-${action.action}-${model.tradeId}`}
            >
              {workingAction === actionKey ? <ActivityIndicator color="#ffffff" size="small" /> : null}
              <Text style={[styles.actionText, action.tone === 'secondary' && light && styles.textLight]}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const NativeTradeActivityScreen = ({
  assetBaseUrl,
  error,
  isLoading,
  onAction,
  onOpenPreferences,
  onRetry,
  onRevealPartner,
  rows,
  showModeTabs = true,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const fadeAnimation = useNativeModalAnimation('fade');
  const slideAnimation = useNativeModalAnimation('slide');
  const [selectedFilter, setSelectedFilter] = useState<TradeActivityFilter>('Accepting');
  const [pending, setPending] = useState<{
    row: NativeTradeActivityRow;
    action: Exclude<NativeTradeActivityActionModel['action'], 'coordinate'>;
  } | null>(null);
  const [partner, setPartner] = useState<{ username: string; info: PartnerInfo } | null>(null);
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const listRef = useRef<FlatList<NativeTradeActivityRow>>(null);
  const counts = useMemo(() => Object.fromEntries(TRADE_ACTIVITY_FILTERS.map((filter) => [
    filter,
    rows.filter((row) => row.model.activityFilter === filter).length,
  ])) as Record<TradeActivityFilter, number>, [rows]);
  const visibleRows = useMemo(
    () => rows.filter((row) => row.model.activityFilter === selectedFilter),
    [rows, selectedFilter],
  );
  const runPendingAction = async () => {
    if (!pending) return;
    const { action, row } = pending;
    setPending(null);
    setFeedback(null);
    setWorkingAction(`${row.model.tradeId}:${action}`);
    try {
      await onAction(row.model, action);
      setFeedback({ tone: 'success', text: 'Trade updated from the server response.' });
    } catch (actionError) {
      setFeedback({
        tone: 'error',
        text: actionError instanceof Error
          ? actionError.message
          : 'The trade could not be updated. Please try again.',
      });
    } finally {
      setWorkingAction(null);
    }
  };
  const revealPartner = async (row: NativeTradeActivityRow) => {
    setFeedback(null);
    setWorkingAction(`${row.model.tradeId}:coordinate`);
    try {
      const info = await onRevealPartner(row.model.tradeId);
      setPartner({ username: row.model.partnerUsername, info });
    } catch (revealError) {
      setFeedback({
        tone: 'error',
        text: revealError instanceof Error
          ? revealError.message
          : 'Coordination details could not be loaded.',
      });
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <View style={[styles.screen, light && styles.screenLight]} testID="native-trade-activity-screen">
      {showModeTabs ? (
        <View style={[styles.modeTabs, light && styles.modeTabsLight]}>
          <Pressable aria-selected={false} accessibilityRole="tab" accessibilityState={{ selected: false }} onPress={onOpenPreferences} style={styles.modeTab}>
            <Text style={[styles.modeTabText, light && styles.secondaryLight]}>Trade Preferences</Text>
          </Pressable>
          <View aria-selected accessibilityRole="tab" accessibilityState={{ selected: true }} style={[styles.modeTab, styles.activeModeTab]}>
            <Text style={styles.activeModeText}>Trade Activity</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.pageHeading}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.25} style={[styles.pageTitle, light && styles.textLight]}>
          Your trades
        </Text>
        <Text maxFontSizeMultiplier={1.25} style={[styles.pageDescription, light && styles.secondaryLight]}>
          Respond to offers, track active trades, and revisit past exchanges.
        </Text>
      </View>

      <View accessibilityRole="tablist" style={[styles.statusTabs, light && styles.statusTabsLight]}>
        {TRADE_ACTIVITY_FILTERS.map((filter) => {
          const selected = filter === selectedFilter;
          const tone = FILTER_TONES[filter];
          return (
            <Pressable
              aria-selected={selected}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={filter}
              onPress={() => {
                setFeedback(null);
                listRef.current?.scrollToOffset({ animated: false, offset: 0 });
                setSelectedFilter(filter);
              }}
              style={[
                styles.statusTab,
                selected && styles.activeStatusTab,
                selected && { borderColor: tone.border, backgroundColor: tone.surface },
              ]}
              testID={`trade-filter-${filter}`}
            >
              <Text
                maxFontSizeMultiplier={1.15}
                numberOfLines={2}
                style={[styles.statusTabText, light && styles.secondaryLight, selected && styles.activeStatusText]}
              >
                {FILTER_LABELS[filter].compact}
              </Text>
              <View style={[styles.countBadge, selected && { backgroundColor: tone.accent }]}>
                <Text style={styles.countText}>{counts[filter]}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {feedback ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[styles.feedback, feedback.tone === 'success' ? styles.feedbackSuccess : styles.feedbackError]}
          testID="trade-activity-feedback"
        >
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          <Pressable accessibilityLabel="Dismiss message" accessibilityRole="button" onPress={() => setFeedback(null)}>
            <Text style={styles.feedbackDismiss}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <View accessibilityRole="alert" style={[styles.feedback, styles.feedbackError]}>
          <View style={styles.errorCopy}>
            <Text style={styles.feedbackTitle}>Trades unavailable</Text>
            <Text style={styles.feedbackText}>{error}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#36c181" size="large" />
          <Text style={[styles.stateTitle, light && styles.textLight]}>Loading trades</Text>
          <Text style={[styles.stateBody, light && styles.secondaryLight]}>Checking the server for your current activity…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={visibleRows.length ? styles.listContent : styles.emptyListContent}
          data={visibleRows}
          keyExtractor={(row) => row.model.tradeId}
          ListEmptyComponent={error ? null : (
            <View style={[styles.emptyState, light && styles.cardLight]}>
              <View style={styles.emptyIcon}><NativeUiIcon color="#36c181" name="trade" size={22} /></View>
              <Text style={[styles.stateTitle, light && styles.textLight]}>No trades here</Text>
              <Text style={[styles.stateBody, light && styles.secondaryLight]}>
                {selectedFilter === 'Accepting'
                  ? 'New offers that need your response will appear here.'
                  : selectedFilter === 'Proposed'
                    ? 'Sent proposals will appear here.'
                    : selectedFilter === 'Pending'
                      ? 'Accepted trades stay here until both trainers confirm completion.'
                      : selectedFilter === 'Completed'
                        ? 'Completed exchanges will appear here.'
                        : 'Cancelled and denied proposals appear here.'}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TradeCard
              assetBaseUrl={assetBaseUrl}
              light={light}
              onRequestAction={(row, action) => setPending({ row, action })}
              onRevealPartner={(row) => void revealPartner(row)}
              row={item}
              workingAction={workingAction}
            />
          )}
          showsVerticalScrollIndicator={false}
          testID="trade-activity-list"
        />
      )}

      <Modal animationType={fadeAnimation} onRequestClose={() => setPending(null)} transparent visible={Boolean(pending)}>
        <View style={styles.modalOverlay}>
          {pending ? (
            <View style={[styles.modalCard, light && styles.modalCardLight]} testID="trade-action-confirmation">
              <Text style={styles.modalEyebrow}>TRAINER ACTION</Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.modalTitle, light && styles.textLight]}>
                {confirmationCopy(pending.action).title}
              </Text>
              <Text maxFontSizeMultiplier={1.3} style={[styles.modalBody, light && styles.secondaryLight]}>
                {confirmationCopy(pending.action).body}
              </Text>
              <View style={styles.modalActions}>
                <Pressable accessibilityRole="button" onPress={() => setPending(null)} style={styles.modalCancel}>
                  <Text style={[styles.modalCancelText, light && styles.textLight]}>Cancel</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => void runPendingAction()} style={styles.modalConfirm}>
                  <Text style={styles.modalConfirmText}>{confirmationCopy(pending.action).confirm}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal animationType={slideAnimation} onRequestClose={() => setPartner(null)} transparent visible={Boolean(partner)}>
        <View style={styles.modalOverlay}>
          {partner ? (
            <View style={[styles.partnerCard, light && styles.modalCardLight]} testID="trade-partner-information">
              <Text style={styles.modalEyebrow}>COORDINATE EXTERNALLY</Text>
              <Text style={[styles.modalTitle, light && styles.textLight]}>{partner.username}</Text>
              <Text style={[styles.modalBody, light && styles.secondaryLight]}>
                Pokémon Go Nexus does not include chat. Use only the details this trainer chose to share, then coordinate through Pokémon GO Campfire, Discord, or another agreed platform.
              </Text>
              {partner.info.sharingEnabled ? (
                <View style={styles.partnerRows}>
                  {partner.info.pokemonGoName ? <Text style={[styles.partnerRow, light && styles.textLight]}>Pokémon GO name: {partner.info.pokemonGoName}</Text> : null}
                  {partner.info.trainerCode ? <Text style={[styles.partnerRow, light && styles.textLight]}>Trainer code: {partner.info.trainerCode}</Text> : null}
                  <Text style={[styles.partnerRow, light && styles.textLight]}>Preferred method: {partner.info.coordinationMethod}</Text>
                  {partner.info.coordinationHandle ? <Text style={[styles.partnerRow, light && styles.textLight]}>Handle: {partner.info.coordinationHandle}</Text> : null}
                  {partner.info.location ? <Text style={[styles.partnerRow, light && styles.textLight]}>Location: {partner.info.location}</Text> : null}
                </View>
              ) : (
                <Text style={[styles.partnerUnavailable, light && styles.secondaryLight]}>
                  This trainer has not enabled contact sharing.
                </Text>
              )}
              <Pressable accessibilityRole="button" onPress={() => setPartner(null)} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Done</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Keep the persistent Poké Ball in its own visual lane. A scrollable action
  // must never settle underneath the anchor, where the anchor would intercept
  // the user's press (most visibly with large text on narrow phones).
  screen: { flex: 1, gap: 9, paddingTop: 7, paddingBottom: 86, backgroundColor: '#07100f' },
  screenLight: { backgroundColor: '#f8fff9' },
  modeTabs: { flexDirection: 'row', marginHorizontal: 8, borderWidth: 1, borderColor: '#1d4a43', borderRadius: 10, padding: 4, backgroundColor: '#081312' },
  modeTabsLight: { borderColor: '#9db8b2', backgroundColor: '#e8efed' },
  modeTab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 7, paddingHorizontal: 8 },
  activeModeTab: { backgroundColor: '#36c5a4' },
  modeTabText: { color: '#9eb8b3', fontWeight: '800', textAlign: 'center' },
  activeModeText: { color: '#041411', fontWeight: '900' },
  pageHeading: { alignItems: 'center', gap: 3, paddingHorizontal: 18 },
  pageTitle: { color: '#f4faf8', fontSize: 23, lineHeight: 27, fontWeight: '900', textAlign: 'center' },
  pageDescription: { maxWidth: 420, color: '#9db6b2', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  statusTabs: { flexDirection: 'row', marginHorizontal: 8, borderWidth: 1, borderColor: '#1b403b', borderRadius: 12, padding: 4, backgroundColor: '#071211' },
  statusTabsLight: { borderColor: '#abc1bc', backgroundColor: '#eef3f2' },
  statusTab: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 8, paddingHorizontal: 2 },
  activeStatusTab: { borderWidth: 1 },
  statusTabText: { color: '#a4b8b4', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  activeStatusText: { color: '#ffffff' },
  countBadge: { minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#182725' },
  countText: { color: '#e7f4f1', fontSize: 11, fontWeight: '900' },
  // Leave every terminal action scrollable above the persistent action-menu
  // anchor. Without this clearance, the anchor can intercept a press on the
  // final card action even though that action is technically visible.
  listContent: { gap: 12, paddingHorizontal: 8, paddingBottom: 96 },
  emptyListContent: { paddingHorizontal: 8, paddingBottom: 92 },
  tradeCard: { overflow: 'hidden', borderWidth: 1, borderColor: '#24554d', borderRadius: 13, backgroundColor: '#111b1a' },
  cardLight: { borderColor: '#9ab7b0', backgroundColor: '#ffffff' },
  tradeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, borderLeftWidth: 4, borderLeftColor: '#36c181', borderBottomWidth: 1, borderBottomColor: '#204640', padding: 11 },
  tradeHeaderCopy: { flex: 1, gap: 1 },
  statusLabel: { color: '#42d492', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  tradeTitle: { color: '#f7fbfa', fontSize: 16, fontWeight: '900' },
  tradeDescription: { color: '#9fb7b2', fontSize: 12, lineHeight: 16 },
  date: { flexShrink: 0, color: '#99b3ae', fontSize: 11 },
  exchange: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  pokemonCard: { flex: 1, minWidth: 0, minHeight: 205, alignItems: 'center', borderWidth: 1, borderColor: '#2b5a53', borderRadius: 11, padding: 7, backgroundColor: '#071514' },
  surfaceLight: { borderColor: '#a8bdb8', backgroundColor: '#f5f9f8' },
  partyLabel: {
    width: '100%',
    minHeight: 26,
    color: '#62d7bd',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.55,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  pokemonStage: { width: '100%', height: 124, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  luckyBackdrop: { position: 'absolute', width: 138, height: 138, opacity: 0.88 },
  pokemonImage: { width: 112, height: 112 },
  maxBadge: { position: 'absolute', top: 7, right: 6, width: 32, height: 32 },
  missingPokemon: { color: '#9fb7b2', fontSize: 12 },
  pokemonName: { minHeight: 38, color: '#ffffff', fontSize: 14, lineHeight: 17, fontWeight: '900', textAlign: 'center' },
  exchangeIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#193632' },
  exchangeIcon: { width: 29, height: 29 },
  conditions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginHorizontal: 8, borderWidth: 1, borderColor: '#244b45', borderRadius: 10, padding: 9, backgroundColor: '#0a1715' },
  conditionsLight: { borderColor: '#a8bdb8', backgroundColor: '#eef5f3' },
  friendshipGroup: { flex: 1, minWidth: 0, gap: 3 },
  costGroup: { flexShrink: 0, alignItems: 'flex-end', gap: 3 },
  conditionLabel: { color: '#69ceb6', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  conditionIcons: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 3 },
  hearts: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center' },
  heart: { width: 22, height: 22, marginRight: -1 },
  conditionIconTile: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#193632' },
  conditionIcon: { width: 30, height: 30 },
  inactive: { opacity: 0.25 },
  costValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stardust: { width: 20, height: 34 },
  costText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, padding: 8 },
  actionButton: { flexGrow: 1, minWidth: '46%', minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 8, paddingHorizontal: 10 },
  primaryAction: { backgroundColor: '#2fbd79' },
  secondaryAction: { borderWidth: 1, borderColor: '#64817b', backgroundColor: 'transparent' },
  destructiveAction: { backgroundColor: '#a44250' },
  actionText: { color: '#ffffff', fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
  feedback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginHorizontal: 8, borderWidth: 1, borderRadius: 10, padding: 11 },
  feedbackSuccess: { borderColor: '#2fbd79', backgroundColor: '#13372b' },
  feedbackError: { borderColor: '#ef5b72', backgroundColor: '#3a1820' },
  feedbackTitle: { color: '#ffffff', fontWeight: '900' },
  feedbackText: { flex: 1, color: '#ffffff', lineHeight: 19 },
  feedbackDismiss: { color: '#ffffff', fontSize: 24, lineHeight: 26 },
  errorCopy: { flex: 1, gap: 2 },
  retryButton: { minHeight: 40, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#ef5b72' },
  retryText: { color: '#ffffff', fontWeight: '900' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 26 },
  emptyState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderStyle: 'dashed', borderColor: '#2b5a53', borderRadius: 13, padding: 22, backgroundColor: '#111b1a' },
  emptyIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#19302d' },
  emptyIconText: { color: '#42d4c4', fontSize: 22 },
  stateTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  stateBody: { maxWidth: 340, color: '#9fb7b2', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: '#000000b8' },
  modalCard: { width: '100%', maxWidth: 440, gap: 10, borderWidth: 1, borderColor: '#36c5a4', borderRadius: 18, padding: 18, backgroundColor: '#10201e' },
  modalCardLight: { borderColor: '#428f80', backgroundColor: '#ffffff' },
  modalEyebrow: { color: '#42d4c4', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  modalBody: { color: '#b0c5c0', fontSize: 15, lineHeight: 21 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  modalCancel: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#617a75', borderRadius: 24 },
  modalCancelText: { color: '#ffffff', fontWeight: '900' },
  modalConfirm: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, paddingHorizontal: 15, backgroundColor: '#36c5a4' },
  modalConfirmText: { color: '#041411', fontWeight: '900', textAlign: 'center' },
  partnerCard: { width: '100%', maxWidth: 460, gap: 11, borderWidth: 1, borderColor: '#36c5a4', borderRadius: 18, padding: 18, backgroundColor: '#10201e' },
  partnerRows: { gap: 7, borderWidth: 1, borderColor: '#315750', borderRadius: 11, padding: 12 },
  partnerRow: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
  partnerUnavailable: { color: '#b0c5c0', fontSize: 14, lineHeight: 20 },
  textLight: { color: '#13201e' },
  secondaryLight: { color: '#526762' },
});

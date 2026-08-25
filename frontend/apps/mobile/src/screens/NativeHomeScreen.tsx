import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeCollectionRow } from '../features/collection/collectionModel';
import type {
  NativeHomeCollectionSummary,
  NativeHomeTradeSummary,
} from '../features/home/nativeHomeDashboardModel';

type FriendsState = 'error' | 'loading' | 'ready';

type NativeHomeScreenProps = {
  assetBaseUrl: string;
  collection: NativeHomeCollectionSummary;
  error?: string | null;
  friendsState: FriendsState;
  incomingFriends: number;
  isLoading?: boolean;
  onDismissActionMenuHint: () => void;
  onNavigate: (path: string) => void;
  onRetry: () => void;
  pokemonGoName?: string | null;
  recentRows: NativeCollectionRow[];
  showActionMenuHint: boolean;
  trades: NativeHomeTradeSummary;
  username: string;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const SectionHeading = ({
  action,
  eyebrow,
  light,
  onAction,
  title,
}: {
  action?: string;
  eyebrow: string;
  light: boolean;
  onAction?: () => void;
  title: string;
}) => (
  <View style={styles.sectionHeading}>
    <View style={styles.sectionHeadingCopy}>
      <Text style={styles.eyebrow}>{eyebrow.toLocaleUpperCase()}</Text>
      <Text accessibilityRole="header" style={[styles.sectionTitle, light && styles.textLight]}>{title}</Text>
    </View>
    {action && onAction ? (
      <Pressable accessibilityRole="button" onPress={onAction} style={styles.textAction}>
        <Text style={[styles.textActionLabel, light && styles.textActionLabelLight]}>{action}</Text>
        <Text style={[styles.textActionArrow, light && styles.textActionLabelLight]}>›</Text>
      </Pressable>
    ) : null}
  </View>
);

const ActionCard = ({
  accent,
  detail,
  glyph,
  light,
  onPress,
  title,
}: {
  accent: string;
  detail: string;
  glyph: string;
  light: boolean;
  onPress: () => void;
  title: string;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionCard,
      light && styles.actionCardLight,
      pressed && styles.pressed,
    ]}
  >
    <View style={[styles.actionIcon, { backgroundColor: `${accent}1f` }]}>
      <Text maxFontSizeMultiplier={1} style={[styles.actionGlyph, { color: accent }]}>{glyph}</Text>
    </View>
    <View style={styles.actionCopy}>
      <Text style={[styles.actionTitle, light && styles.textLight]}>{title}</Text>
      <Text style={[styles.actionDetail, light && styles.mutedLight]}>{detail}</Text>
    </View>
    <Text style={[styles.cardArrow, light && styles.mutedLight]}>›</Text>
  </Pressable>
);

const StatCard = ({
  accent,
  detail,
  label,
  light,
  onPress,
  value,
}: {
  accent: string;
  detail?: string;
  label: string;
  light: boolean;
  onPress: () => void;
  value: number;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.statCard,
      light && styles.statCardLight,
      { borderTopColor: accent },
      pressed && styles.pressed,
    ]}
  >
    <Text style={[styles.statValue, { color: accent }]}>{value.toLocaleString()}</Text>
    <Text style={[styles.statLabel, light && styles.textLight]}>{label}</Text>
    {detail ? <Text style={[styles.statDetail, light && styles.mutedLight]}>{detail}</Text> : null}
  </Pressable>
);

const ToolLink = ({
  assetBaseUrl,
  detail,
  icon,
  label,
  light,
  onPress,
}: {
  assetBaseUrl: string;
  detail: string;
  icon: string;
  label: string;
  light: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.tool, light && styles.toolLight, pressed && styles.pressed]}
  >
    <Image resizeMode="contain" source={{ uri: toAssetUrl(assetBaseUrl, icon) }} style={styles.toolIcon} />
    <View style={styles.toolCopy}>
      <Text style={[styles.toolLabel, light && styles.textLight]}>{label}</Text>
      <Text style={[styles.toolDetail, light && styles.mutedLight]}>{detail}</Text>
    </View>
    <Text style={[styles.cardArrow, light && styles.mutedLight]}>›</Text>
  </Pressable>
);

export const NativeHomeScreen = ({
  assetBaseUrl,
  collection,
  error = null,
  friendsState,
  incomingFriends,
  isLoading = false,
  onDismissActionMenuHint,
  onNavigate,
  onRetry,
  pokemonGoName,
  recentRows,
  showActionMenuHint,
  trades,
  username,
}: NativeHomeScreenProps) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const firstName = pokemonGoName?.trim() || username;
  const attentionCount = trades.needsResponse + trades.readyToConfirm + incomingFriends;
  const friendTitle = friendsState === 'loading'
    ? 'Checking friend requests…'
    : friendsState === 'error'
      ? 'Friends are temporarily unavailable'
      : incomingFriends
        ? `${incomingFriends} friend request${incomingFriends === 1 ? '' : 's'}`
        : 'No new friend requests';

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-home-screen">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 108 },
        ]}
      >
        <View style={styles.brandHeader}>
          <Pressable accessibilityRole="button" onPress={() => onNavigate('/')} style={styles.brand}>
            <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.brandLogo} />
            <Text style={[styles.brandName, light && styles.textLight]}>Pokémon Go Nexus</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Open @${username} profile`}
            accessibilityRole="button"
            onPress={() => onNavigate('/profile')}
            style={[styles.profileLink, light && styles.profileLinkLight]}
          >
            <View style={styles.profileInitial}>
              <Text maxFontSizeMultiplier={1} style={styles.profileInitialText}>{username.slice(0, 1).toLocaleUpperCase()}</Text>
            </View>
            <Text numberOfLines={1} style={[styles.profileUsername, light && styles.textLight]}>@{username}</Text>
          </Pressable>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>TRAINER DASHBOARD</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Welcome back,{`\n`}{firstName}</Text>
          <Text style={[styles.lead, light && styles.mutedLight]}>Your collection, trades, and trainer network—together in one place.</Text>
          <Pressable accessibilityRole="button" onPress={() => onNavigate('/search')} style={styles.primaryButton}>
            <Text maxFontSizeMultiplier={1} style={styles.primaryGlyph}>⌕</Text>
            <Text style={styles.primaryButtonText}>Find Pokémon</Text>
          </Pressable>
        </View>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Dashboard needs another try</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.panel, light && styles.panelLight]}>
          <SectionHeading
            action="Open trade activity"
            eyebrow="Up next"
            light={light}
            onAction={() => onNavigate('/trades?section=activity')}
            title={attentionCount
              ? `${attentionCount} item${attentionCount === 1 ? '' : 's'} need your attention`
              : 'You’re all caught up'}
          />
          {isLoading ? <ActivityIndicator color="#299cf5" style={styles.loader} /> : null}
          <View style={styles.actionGrid}>
            <ActionCard
              accent="#35c984"
              detail={trades.needsResponse ? 'A trainer is waiting for your response.' : 'New trade proposals will appear here.'}
              glyph="↔"
              light={light}
              onPress={() => onNavigate('/trades?section=activity')}
              title={trades.needsResponse ? `${trades.needsResponse} offer${trades.needsResponse === 1 ? '' : 's'} to review` : 'No new offers'}
            />
            <ActionCard
              accent="#35c984"
              detail={trades.waiting ? `${trades.waiting} active trade${trades.waiting === 1 ? '' : 's'} waiting on another trainer.` : 'Accepted trades will show up here.'}
              glyph="✓"
              light={light}
              onPress={() => onNavigate('/trades?section=activity')}
              title={trades.readyToConfirm ? `${trades.readyToConfirm} trade${trades.readyToConfirm === 1 ? '' : 's'} ready to confirm` : 'No confirmations due'}
            />
            <ActionCard
              accent="#2389ed"
              detail={friendsState === 'error' ? 'Open Friends to try again.' : 'Grow your trusted trainer network.'}
              glyph="♟"
              light={light}
              onPress={() => onNavigate('/profile/friends')}
              title={friendTitle}
            />
          </View>
        </View>

        <View style={[styles.panel, light && styles.panelLight]}>
          <SectionHeading
            action="Manage Pokémon"
            eyebrow="Your collection"
            light={light}
            onAction={() => onNavigate('/pokemon')}
            title="At a glance"
          />
          <View style={styles.statGrid}>
            <StatCard accent="#299cf5" label="Caught" light={light} onPress={() => onNavigate('/pokemon?filter=caught')} value={collection.caught} />
            <StatCard accent="#e7bb1f" label="★ Favorites" light={light} onPress={() => onNavigate('/pokemon?filter=favorites')} value={collection.favorites} />
            <StatCard accent="#35c984" label="↔ For Trade" light={light} onPress={() => onNavigate('/pokemon?filter=trade')} value={collection.forTrade} />
            <StatCard accent="#f05a70" detail={collection.mostWanted ? `${collection.mostWanted} most wanted` : undefined} label="♥ Wanted" light={light} onPress={() => onNavigate('/pokemon?filter=wanted')} value={collection.wanted} />
          </View>
          <View style={styles.panelActions}>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/pokemon')} style={[styles.panelAction, light && styles.panelActionLight]}>
              <Text style={[styles.panelActionText, light && styles.textLight]}>Open collection</Text><Text style={[styles.cardArrow, light && styles.mutedLight]}>›</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onNavigate('/trade-board')} style={[styles.panelAction, light && styles.panelActionLight]}>
              <Text style={[styles.panelActionText, light && styles.textLight]}>⌯ Share Trade Board</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.panel, light && styles.panelLight]}>
          <SectionHeading eyebrow="Trading" light={light} title="Trade workspace" />
          <View style={[styles.tradeSummary, light && styles.tradeSummaryLight]}>
            <Text style={[styles.tradeMetric, light && styles.textLight]}><Text style={styles.tradeMetricValue}>{trades.active}</Text> active</Text>
            <View style={[styles.metricDivider, light && styles.metricDividerLight]} />
            <Text style={[styles.tradeMetric, light && styles.textLight]}><Text style={styles.tradeMetricValue}>{trades.completed}</Text> completed</Text>
          </View>
          <View style={styles.tradeLinks}>
            <ActionCard accent="#f05a70" detail="Fine-tune what you offer and want." glyph="♥" light={light} onPress={() => onNavigate('/trades?section=preferences')} title="Trade preferences" />
            <ActionCard accent="#35c984" detail="Review proposals and complete trades." glyph="◷" light={light} onPress={() => onNavigate('/trades?section=activity')} title="Trade activity" />
            <ActionCard accent="#299cf5" detail="Create a shareable snapshot or live link." glyph="⌯" light={light} onPress={() => onNavigate('/trade-board')} title="Share Trade Board" />
          </View>
        </View>

        <View style={[styles.panel, light && styles.panelLight]}>
          <SectionHeading action="View all" eyebrow="Recently updated" light={light} onAction={() => onNavigate('/pokemon')} title="Your latest Pokémon" />
          {recentRows.length ? (
            <View style={styles.recentList}>
              {recentRows.map((row) => (
                <Pressable
                  accessibilityLabel={`Open ${row.name} in your Pokémon collection`}
                  accessibilityRole="button"
                  key={row.id}
                  onPress={() => onNavigate(`/pokemon?filter=${row.status}&instanceId=${encodeURIComponent(row.id)}`)}
                  style={({ pressed }) => [styles.recentRow, light && styles.recentRowLight, pressed && styles.pressed]}
                >
                  <View style={[styles.recentImageWrap, light && styles.recentImageWrapLight]}>
                    {row.locationBackgroundUri ? <Image source={{ uri: row.locationBackgroundUri }} style={StyleSheet.absoluteFill} /> : null}
                    {row.imageUri ? <Image resizeMode="contain" source={{ uri: row.imageUri }} style={styles.recentImage} /> : null}
                  </View>
                  <View style={styles.recentCopy}>
                    <Text numberOfLines={2} style={[styles.recentName, light && styles.textLight]}>{row.name}</Text>
                    <Text style={[styles.recentStatus, row.status === 'trade' ? styles.tradeText : row.status === 'wanted' ? styles.wantedText : light ? styles.mutedLight : null]}>{row.status === 'trade' ? 'For Trade' : row.status === 'wanted' ? row.mostWanted ? 'Most Wanted' : 'Wanted' : row.favorite ? 'Favorite' : 'Caught'}</Text>
                  </View>
                  <Text style={[styles.cardArrow, light && styles.mutedLight]}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, light && styles.emptyStateLight]}>
              <Text style={styles.emptyPlus}>＋</Text>
              <View style={styles.emptyCopy}><Text style={[styles.emptyTitle, light && styles.textLight]}>Start your collection</Text><Text style={[styles.actionDetail, light && styles.mutedLight]}>Add your first caught or wanted Pokémon to see recent updates here.</Text></View>
              <Pressable accessibilityRole="button" onPress={() => onNavigate('/pokemon')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Open Pokémon</Text></Pressable>
            </View>
          )}
        </View>

        <View style={[styles.panel, light && styles.panelLight]}>
          <SectionHeading action="Help & guides" eyebrow="Explore" light={light} onAction={() => onNavigate('/help')} title="More trainer tools" />
          <View style={styles.toolsGrid}>
            <ToolLink assetBaseUrl={assetBaseUrl} detail="Track registrations" icon="/images/btn_pokedex.png" label="Pokédex" light={light} onPress={() => onNavigate('/pokedex')} />
            <ToolLink assetBaseUrl={assetBaseUrl} detail="Build counters" icon="/images/btn_raid.png" label="Raids" light={light} onPress={() => onNavigate('/raid')} />
            <ToolLink assetBaseUrl={assetBaseUrl} detail="Explore rankings" icon="/images/btn_pvp.png" label="PvP" light={light} onPress={() => onNavigate('/pvp')} />
            <ToolLink assetBaseUrl={assetBaseUrl} detail="Plan your team" icon="/images/btn_max.png" label="Max Battles" light={light} onPress={() => onNavigate('/max')} />
          </View>
        </View>
      </ScrollView>

      {showActionMenuHint ? (
        <View style={[styles.actionMenuHint, light && styles.actionMenuHintLight, { bottom: Math.max(82, insets.bottom + 70) }]}>
          <Image source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/logo.png') }} style={styles.hintLogo} />
          <View style={styles.hintCopy}>
            <Text style={styles.eyebrow}>QUICK NAVIGATION</Text>
            <Text style={[styles.hintText, light && styles.textLight]}>Tap the Poké Ball below for quick navigation.</Text>
          </View>
          <Pressable accessibilityLabel="Dismiss quick navigation hint" accessibilityRole="button" onPress={onDismissActionMenuHint} style={styles.hintDismiss}>
            <Text style={[styles.hintDismissText, light && styles.textLight]}>×</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071012' },
  rootLight: { backgroundColor: '#eef7f3' },
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', gap: 16, paddingHorizontal: 12 },
  brandHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: { width: 38, height: 38, resizeMode: 'contain' },
  brandName: { flexShrink: 1, color: '#f4fbfd', fontSize: 14, fontWeight: '900' },
  profileLink: { maxWidth: '46%', minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, borderWidth: 1, borderColor: '#425256', borderRadius: 999, backgroundColor: '#161a1c' },
  profileLinkLight: { borderColor: '#bed0d1', backgroundColor: 'rgba(255,255,255,0.62)' },
  profileInitial: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#164d84' },
  profileInitialText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  profileUsername: { minWidth: 0, flexShrink: 1, color: '#f4fbfd', fontSize: 12, fontWeight: '900' },
  welcome: { gap: 7, paddingVertical: 9 },
  eyebrow: { color: '#299cf5', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  title: { color: '#ffffff', fontSize: 31, fontWeight: '900', letterSpacing: -0.8, lineHeight: 33 },
  lead: { color: '#a8b6b9', fontSize: 15, lineHeight: 21 },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, borderRadius: 10, backgroundColor: '#299cf5' },
  primaryGlyph: { color: '#071012', fontSize: 22, fontWeight: '900' },
  primaryButtonText: { color: '#071012', fontSize: 15, fontWeight: '900' },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1, borderColor: '#ff5c78', borderRadius: 13, backgroundColor: '#32181f' },
  errorCopy: { minWidth: 0, flex: 1, gap: 3 },
  errorTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  errorText: { color: '#ffc0cc', fontSize: 12, lineHeight: 17 },
  retryButton: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9, backgroundColor: '#ff5c78' },
  retryText: { color: '#141414', fontWeight: '900' },
  panel: { gap: 12, padding: 14, borderWidth: 1, borderColor: '#344347', borderRadius: 16, backgroundColor: '#141819' },
  panelLight: { borderColor: '#c9d9d6', backgroundColor: 'rgba(255,255,255,0.56)' },
  sectionHeading: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeadingCopy: { minWidth: 0, flex: 1, gap: 2 },
  sectionTitle: { color: '#f5fbfc', fontSize: 20, fontWeight: '900', lineHeight: 24 },
  textAction: { minHeight: 40, maxWidth: '46%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  textActionLabel: { color: '#b4c1c3', fontSize: 10, fontWeight: '900', textAlign: 'right' },
  textActionLabelLight: { color: '#345457' },
  textActionArrow: { color: '#b4c1c3', fontSize: 22, fontWeight: '900' },
  loader: { paddingVertical: 3 },
  actionGrid: { gap: 10 },
  actionCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderWidth: 1, borderColor: '#354044', borderRadius: 12, backgroundColor: '#101314' },
  actionCardLight: { borderColor: '#d0dcda', backgroundColor: 'rgba(255,255,255,0.68)' },
  actionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  actionGlyph: { fontSize: 20, fontWeight: '900' },
  actionCopy: { minWidth: 0, flex: 1, gap: 3 },
  actionTitle: { color: '#f5fbfc', fontSize: 14, fontWeight: '900' },
  actionDetail: { color: '#9eadaf', fontSize: 11, lineHeight: 15 },
  cardArrow: { color: '#b4c1c3', fontSize: 22, fontWeight: '800' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  statCard: { minHeight: 92, flexBasis: '47%', flexGrow: 1, justifyContent: 'center', gap: 3, padding: 12, borderWidth: 1, borderTopWidth: 3, borderColor: '#364347', borderRadius: 11, backgroundColor: '#101314' },
  statCardLight: { borderColor: '#d0dcda', backgroundColor: 'rgba(255,255,255,0.72)' },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#f5fbfc', fontSize: 13, fontWeight: '900' },
  statDetail: { color: '#9eadaf', fontSize: 10 },
  panelActions: { flexDirection: 'row', gap: 9 },
  panelAction: { minHeight: 45, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: '#48575a', borderRadius: 10 },
  panelActionLight: { borderColor: '#aebdbf' },
  panelActionText: { color: '#f5fbfc', fontSize: 11, fontWeight: '900' },
  tradeSummary: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 10, borderRadius: 11, backgroundColor: '#0c2520' },
  tradeSummaryLight: { backgroundColor: '#e0f7ee' },
  tradeMetric: { flex: 1, color: '#ecf8f4', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  tradeMetricValue: { color: '#35c984', fontSize: 22, fontWeight: '900' },
  metricDivider: { width: 1, height: 38, backgroundColor: '#31534b' },
  metricDividerLight: { backgroundColor: '#a9d7c8' },
  tradeLinks: { gap: 9 },
  recentList: { gap: 8 },
  recentRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderWidth: 1, borderColor: '#364347', borderRadius: 11, backgroundColor: '#101314' },
  recentRowLight: { borderColor: '#d0dcda', backgroundColor: 'rgba(255,255,255,0.68)' },
  recentImageWrap: { width: 60, height: 56, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#0a1113' },
  recentImageWrapLight: { backgroundColor: '#edf4f3' },
  recentImage: { width: '88%', height: '88%' },
  recentCopy: { minWidth: 0, flex: 1, gap: 2 },
  recentName: { color: '#f5fbfc', fontSize: 13, fontWeight: '900' },
  recentStatus: { color: '#9eadaf', fontSize: 10, fontWeight: '800' },
  tradeText: { color: '#35c984' },
  wantedText: { color: '#f05a70' },
  emptyState: { gap: 10, padding: 13, borderWidth: 1, borderColor: '#3b484c', borderRadius: 11, backgroundColor: '#101314' },
  emptyStateLight: { borderColor: '#d0dcda', backgroundColor: 'rgba(255,255,255,0.68)' },
  emptyPlus: { color: '#299cf5', fontSize: 24, fontWeight: '900' },
  emptyCopy: { gap: 3 },
  emptyTitle: { color: '#f5fbfc', fontSize: 14, fontWeight: '900' },
  emptyButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#299cf5' },
  emptyButtonText: { color: '#071012', fontWeight: '900' },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tool: { minHeight: 72, flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, borderWidth: 1, borderColor: '#364347', borderRadius: 11, backgroundColor: '#101314' },
  toolLight: { borderColor: '#d0dcda', backgroundColor: 'rgba(255,255,255,0.68)' },
  toolIcon: { width: 42, height: 42 },
  toolCopy: { minWidth: 0, flex: 1, gap: 2 },
  toolLabel: { color: '#f5fbfc', fontSize: 12, fontWeight: '900' },
  toolDetail: { color: '#9eadaf', fontSize: 9, lineHeight: 12 },
  actionMenuHint: { position: 'absolute', left: 10, right: 10, zIndex: 18, minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderWidth: 1, borderColor: '#2b9be9', borderRadius: 14, backgroundColor: 'rgba(11, 30, 38, 0.97)' },
  actionMenuHintLight: { backgroundColor: 'rgba(242, 250, 248, 0.98)' },
  hintLogo: { width: 42, height: 42, resizeMode: 'contain' },
  hintCopy: { minWidth: 0, flex: 1, gap: 2 },
  hintText: { color: '#d4e2e4', fontSize: 11, lineHeight: 15 },
  hintDismiss: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  hintDismissText: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  textLight: { color: '#193d40' },
  mutedLight: { color: '#597073' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});

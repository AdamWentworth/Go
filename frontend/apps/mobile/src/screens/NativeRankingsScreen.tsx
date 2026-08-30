import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import type {
  NativeRankingCategory,
  NativeRankingCollectionFilter,
  NativeRankingMode,
  NativeRankingRow,
} from '../features/tools/nativeRankingsModel';
import { NativeUiIcon } from '../components/NativeUiIcon';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

type Props = {
  assetBaseUrl: string;
  collectionFilterCounts: Record<NativeRankingCollectionFilter, number>;
  collectorCount: number;
  error?: string | null;
  hasSnapshot?: boolean;
  initialQuery?: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onBack: () => void;
  onChangeCategory: (category: NativeRankingCategory) => void;
  onChangeCollectionFilter: (filter: NativeRankingCollectionFilter) => void;
  onChangeMode: (mode: NativeRankingMode) => void;
  onChangeQuery: (query: string) => void;
  onOpenEntry: (row: NativeRankingRow) => void;
  onRetry: () => void;
  privacyThreshold: number;
  rows: NativeRankingRow[];
  selectedCategory: NativeRankingCategory;
  selectedCollectionFilter: NativeRankingCollectionFilter;
  selectedMode: NativeRankingMode;
  showCollectionFilters: boolean;
  snapshotLabel: string;
};

const CATEGORIES: readonly {
  asset?: string;
  label: string;
  rarestOnly?: boolean;
  value: NativeRankingCategory;
}[] = [
  { label: 'All', value: 'all' },
  { asset: '/images/shiny_search.png', label: 'Shiny', value: 'shiny' },
  { asset: '/images/costume_search.png', label: 'Costume', value: 'costume' },
  { asset: '/images/shadow_search.png', label: 'Shadow', rarestOnly: true, value: 'shadow' },
  { asset: '/images/gigantamax_title_mask.png', label: 'Max', value: 'max' },
];

const COLLECTION_FILTERS: readonly {
  label: string;
  value: NativeRankingCollectionFilter;
}[] = [
  { label: 'All', value: 'all' },
  { label: 'I have', value: 'owned' },
  { label: 'For trade', value: 'trade' },
  { label: 'I want', value: 'wanted' },
  { label: 'Missing', value: 'missing' },
];

const CATEGORY_LABELS: Record<NativeRankingCategory, string> = {
  all: 'All Pokémon',
  shiny: 'Shiny',
  costume: 'Costume',
  shadow: 'Shadow',
  max: 'Max',
};

const COLLECTION_LABELS: Record<NativeRankingCollectionFilter, string> = {
  all: 'All',
  owned: 'I have',
  trade: 'For trade',
  wanted: 'I want',
  missing: 'Missing',
};

const absoluteUri = (base: string, value: string | null): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const emptyCopy = ({
  category,
  collectionFilter,
  query,
}: {
  category: NativeRankingCategory;
  collectionFilter: NativeRankingCollectionFilter;
  query: string;
}): { action?: string; body: string; title: string } => {
  if (query.trim()) {
    return { action: 'Clear search', body: 'Try another name, form, or Pokédex number.', title: 'No matching Pokémon' };
  }
  if (collectionFilter === 'owned') {
    return { action: 'Show all rankings', body: 'Caught Pokémon and Pokédex registrations appear here.', title: 'None of these are in your collection' };
  }
  if (collectionFilter === 'trade') {
    return { action: 'Show all rankings', body: 'Mark a caught copy for trade to see it in this ranking.', title: 'Nothing is listed for trade' };
  }
  if (collectionFilter === 'wanted') {
    return { action: 'Show all rankings', body: 'Add Pokémon to your wishlist to compare them here.', title: 'Nothing here is on your wishlist' };
  }
  if (collectionFilter === 'missing') {
    return { action: 'Show all rankings', body: 'You have every Pokémon in this view registered or caught.', title: 'Nothing is missing' };
  }
  if (category !== 'all') {
    return { action: 'Show all categories', body: 'This community snapshot has no results in that category.', title: `No ${CATEGORY_LABELS[category].toLocaleLowerCase()} entries` };
  }
  return { body: 'Rankings will appear after the next community snapshot.', title: 'No community entries yet' };
};

export const NativeRankingsScreen = ({
  assetBaseUrl,
  collectionFilterCounts,
  collectorCount,
  error = null,
  hasSnapshot = true,
  initialQuery = '',
  isLoading = false,
  isRefreshing = false,
  onBack: _onBack,
  onChangeCategory,
  onChangeCollectionFilter,
  onChangeMode,
  onChangeQuery,
  onOpenEntry,
  onRetry,
  privacyThreshold,
  rows,
  selectedCategory,
  selectedCollectionFilter,
  selectedMode,
  showCollectionFilters,
  snapshotLabel,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const compact = useWindowDimensions().width <= 420;
  const [query, setQuery] = useState(initialQuery);
  const [methodOpen, setMethodOpen] = useState(false);
  const maximum = useMemo(
    () => Math.max(1, ...rows.map((row) => selectedMode === 'wanted' ? row.wantedUsers ?? 0 : row.caughtUsers)),
    [rows, selectedMode],
  );
  const availableCategories = CATEGORIES.filter(({ rarestOnly }) => !rarestOnly || selectedMode === 'rarest');
  const activeFilters = selectedCategory !== 'all'
    || selectedCollectionFilter !== 'all'
    || Boolean(query.trim());

  const setSearch = (value: string) => {
    setQuery(value);
    onChangeQuery(value);
  };
  const clearAll = () => {
    setSearch('');
    onChangeCategory('all');
    onChangeCollectionFilter('all');
  };
  const empty = emptyCopy({
    category: selectedCategory,
    collectionFilter: showCollectionFilters ? selectedCollectionFilter : 'all',
    query,
  });
  const clearEmptyState = () => {
    if (query.trim()) setSearch('');
    else if (selectedCollectionFilter !== 'all') onChangeCollectionFilter('all');
    else if (selectedCategory !== 'all') onChangeCategory('all');
  };

  const header = (
    <View>
      <View style={[styles.productHeader, compact && styles.productHeaderCompact]}>
        <Image accessibilityElementsHidden resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, '/images/btn_rankings.png') }} style={[styles.productIcon, compact && styles.productIconCompact]} />
        <View style={[styles.headerCopy, compact && styles.headerCopyCompact]}>
          <Text style={[styles.eyebrow, light && styles.accentLight]}>TRAINER COLLECTIONS</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Community Rankings</Text>
        </View>
        <View style={[styles.population, compact && styles.populationCompact, light && styles.populationLight]}>
          <NativeUiIcon color={light ? '#08766b' : '#42d7c4'} name="trainers" size={19} />
          <View><Text style={[styles.populationValue, light && styles.textLight]}>{collectorCount.toLocaleString()}</Text><Text style={[styles.populationLabel, compact && styles.populationLabelCompact, light && styles.mutedLight]}>TRAINERS</Text></View>
        </View>
      </View>

      <View accessibilityRole="tablist" style={[styles.segment, compact && styles.segmentCompact, light && styles.panelLight]}>
        {([['wanted', '♥︎', 'Most wanted'], ['rarest', '◆', 'Rarest owned']] as const).map(([value, icon, label]) => {
          const selected = selectedMode === value;
          return <Pressable aria-selected={selected} accessibilityRole="tab" accessibilityState={{ selected }} key={value} onPress={() => onChangeMode(value)} style={[styles.segmentButton, selected && styles.segmentActive]}><Text style={[styles.segmentIcon, light && styles.textLight, selected && styles.segmentTextActive]}>{icon}</Text><Text style={[styles.segmentText, light && styles.textLight, selected && styles.segmentTextActive]}>{label}</Text></Pressable>;
        })}
      </View>

      <View style={[styles.search, light && styles.inputLight]}>
        <NativeUiIcon color={light ? '#08766b' : '#42d7c4'} name="search" size={18} />
        <TextInput accessibilityLabel="Search rankings" autoCapitalize="none" onChangeText={setSearch} placeholder="Pokémon, number, or form" placeholderTextColor={light ? '#697c7c' : '#7f9395'} style={[styles.searchInput, light && styles.textLight]} value={query} />
        {query ? <Pressable accessibilityLabel="Clear ranking search" accessibilityRole="button" onPress={() => setSearch('')} style={styles.clearSearch}><Text style={[styles.clearSearchText, light && styles.mutedLight]}>×</Text></Pressable> : null}
      </View>

      <View style={styles.context}>
        <View style={styles.contextPrimary}><Text style={[styles.contextLabel, light && styles.accentLight]}>{selectedMode === 'wanted' ? 'MOST WANTED' : 'RAREST OWNED'}</Text><Text style={[styles.contextTitle, light && styles.textLight]}>{selectedMode === 'wanted' ? 'Ranked by distinct trainer wishlists' : 'Fewest trainers with a caught copy or Pokédex registration'}</Text></View>
        <Text style={[styles.contextMeta, light && styles.mutedLight]}>One vote per trainer. Duplicate copies count once.</Text>
      </View>

      <View accessibilityLabel="Ranking filters" style={[styles.filters, light && styles.panelLight]}>
        <Text style={[styles.filterLabel, light && styles.mutedLight]}>CATEGORY</Text>
        <View style={styles.filterGrid}>
          {availableCategories.map(({ asset, label, value }) => {
            const selected = selectedCategory === value;
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={value} onPress={() => onChangeCategory(value)} style={[styles.filterButton, light && styles.controlLight, selected && styles.categoryActive]}>{asset ? <Image source={{ uri: absoluteUri(assetBaseUrl, asset) }} style={[styles.filterIcon, { tintColor: selected ? '#141006' : light ? '#28636a' : '#9eb9bb' }]} /> : null}<Text style={[styles.filterText, light && styles.textLight, selected && styles.categoryActiveText]}>{label}</Text></Pressable>;
          })}
        </View>
        {showCollectionFilters ? <><View style={[styles.filterDivider, light && styles.filterDividerLight]} /><Text style={[styles.filterLabel, light && styles.mutedLight]}>COMPARED WITH YOURS</Text><View style={styles.filterGrid}>{COLLECTION_FILTERS.map(({ label, value }) => {
          const selected = selectedCollectionFilter === value;
          return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={value} onPress={() => onChangeCollectionFilter(value)} style={[styles.filterButton, styles.personalFilter, light && styles.controlLight, selected && styles.personalActive]}><Text numberOfLines={1} style={[styles.filterText, light && styles.textLight, selected && styles.personalActiveText]}>{label}</Text><Text style={[styles.filterCount, light && styles.filterCountLight, selected && styles.personalCountActive]}>{collectionFilterCounts[value].toLocaleString()}</Text></Pressable>;
        })}</View></> : null}
      </View>

      <View style={styles.summary}>
        <Text accessibilityLiveRegion="polite" style={[styles.summaryText, light && styles.mutedLight]}><Text style={[styles.summaryCount, light && styles.textLight]}>{rows.length.toLocaleString()}</Text> results<Text style={styles.summaryDot}>  ·  </Text>{CATEGORY_LABELS[selectedCategory]}{showCollectionFilters ? <Text><Text style={styles.summaryDot}>  ·  </Text>{COLLECTION_LABELS[selectedCollectionFilter]}</Text> : null}</Text>
        {activeFilters ? <Pressable accessibilityRole="button" onPress={clearAll} style={styles.clearFilters}><Text style={[styles.clearFiltersText, light && styles.accentLight]}>Clear</Text></Pressable> : null}
      </View>

      {isLoading && !hasSnapshot ? <View style={[styles.state, light && styles.panelLight]}><ActivityIndicator color={light ? '#08766b' : '#42d7c4'} /><Text style={[styles.stateCopy, light && styles.mutedLight]}>Loading community rankings…</Text></View> : null}
      {error && !hasSnapshot ? <View accessibilityRole="alert" style={[styles.error, light && styles.errorLight]}><Text style={[styles.errorTitle, light && styles.errorTitleLight]}>Rankings are unavailable</Text><Text style={[styles.errorCopy, light && styles.errorCopyLight]}>{error}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable></View> : null}
      {error && hasSnapshot ? <View accessibilityRole="alert" style={[styles.stale, light && styles.staleLight]}><Text style={[styles.staleText, light && styles.mutedLight]}>Showing the last community snapshot. Refresh is temporarily unavailable.</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.staleRetry}><Text style={[styles.staleRetryText, light && styles.textLight]}>Try again</Text></Pressable></View> : null}
    </View>
  );

  const footer = hasSnapshot ? <View><View style={styles.snapshotFooter}><Text style={[styles.snapshotText, light && styles.mutedLight]}>{snapshotLabel}</Text><Pressable accessibilityLabel="Refresh community rankings" accessibilityRole="button" disabled={isRefreshing} onPress={onRetry} style={[styles.refresh, light && styles.controlLight, isRefreshing && styles.disabled]}>{isRefreshing ? <ActivityIndicator color={light ? '#08766b' : '#42d7c4'} size="small" /> : <Text style={[styles.refreshText, light && styles.accentLight]}>↻</Text>}</Pressable></View><View style={[styles.method, light && styles.panelLight]}><Pressable accessibilityRole="button" accessibilityState={{ expanded: methodOpen }} onPress={() => setMethodOpen((value) => !value)} style={styles.methodSummary}><Text style={[styles.methodInfo, light && styles.accentLight]}>ⓘ</Text><Text style={[styles.methodTitle, light && styles.textLight]}>How these rankings work</Text><Text style={[styles.methodChevron, light && styles.mutedLight]}>{methodOpen ? '⌃' : '⌄'}</Text></Pressable>{methodOpen ? <View style={[styles.methodBody, light && styles.methodBodyLight]}><Text style={[styles.methodCopy, light && styles.mutedLight]}><Text style={[styles.methodStrong, light && styles.textLight]}>Most wanted</Text> counts distinct trainer wishlists. Duplicate wanted copies do not add votes.</Text><Text style={[styles.methodCopy, light && styles.mutedLight]}><Text style={[styles.methodStrong, light && styles.textLight]}>Rarest owned</Text> counts trainers with a caught copy or Pokédex registration. Duplicate copies count once.</Text><Text style={[styles.methodCopy, light && styles.mutedLight]}>Ordinary evolution families are collapsed in rarity results, while collectible costumes remain separate. Small totals may be withheld to protect trainer privacy.</Text></View> : null}</View></View> : null;

  return <View style={[styles.root, light && styles.rootLight]} testID="native-rankings-screen"><FlatList contentContainerStyle={{ paddingBottom: 92, paddingHorizontal: 8, paddingTop: 6 }} data={hasSnapshot ? rows : []} keyExtractor={(row) => row.entry.id} ListEmptyComponent={!isLoading && hasSnapshot ? <View style={[styles.empty, styles.emptyParity, light && styles.panelLight]}><NativeUiIcon color={light ? '#08766b' : '#42d7c4'} name="search" size={28} /><Text style={[styles.emptyTitle, light && styles.textLight]}>{empty.title}</Text><Text style={[styles.stateCopy, light && styles.mutedLight]}>{empty.body}</Text>{empty.action ? <Pressable accessibilityRole="button" onPress={clearEmptyState} style={styles.emptyAction}><Text style={styles.emptyActionText}>{empty.action}</Text></Pressable> : null}</View> : null} ListFooterComponent={footer} ListHeaderComponent={header} renderItem={({ index, item }) => {
    const count = selectedMode === 'wanted' ? item.wantedUsers : item.caughtUsers;
    const progress = Math.max(0.04, Number(count ?? 0) / maximum);
    const countLabel = count == null ? selectedMode === 'wanted' ? `Fewer than ${privacyThreshold} trainers want this` : `Owned by fewer than ${privacyThreshold} trainers` : selectedMode === 'wanted' ? count === 1 ? '1 trainer wants this' : `${count.toLocaleString()} trainers want this` : count === 1 ? 'Owned by 1 trainer' : `Owned by ${count.toLocaleString()} trainers`;
    const personalLabels = [item.personal.caughtCount ? `${item.personal.caughtCount} caught` : item.personal.registered ? 'Registered' : '', item.personal.tradeCount ? `${item.personal.tradeCount} for trade` : '', item.personal.wanted ? 'Wanted' : ''].filter(Boolean);
    const openLabel = !showCollectionFilters
      ? 'View Pokémon'
      : item.personal.tradeCount > 0
        ? 'View trade copies'
        : item.personal.wanted
          ? 'View wishlist'
          : item.personal.registered
            ? 'View collection'
            : 'Browse Pokémon';
    const medalColor = item.rank === 1 ? '#f7cf58' : item.rank === 2 ? '#dbe9ed' : item.rank === 3 ? '#d99455' : null;
    return <Pressable accessibilityLabel={`Open rank ${item.rank}, ${item.entry.name}`} accessibilityRole="button" onPress={() => onOpenEntry(item)} style={({ pressed }) => [styles.card, light && styles.cardLight, index % 2 === 1 && (light ? styles.cardAlternateLight : styles.cardAlternate), pressed && styles.pressed]}><View style={styles.cardOverview}><View style={[styles.rank, medalColor ? { backgroundColor: medalColor, borderColor: medalColor } : null]}><Text style={[styles.rankText, medalColor ? styles.rankTextMedal : null]}>{item.rank}</Text></View><View style={styles.pokemonSummary}><View style={styles.artworkStage}>{item.entry.imageUri ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, item.entry.imageUri) }} style={styles.artwork} /> : null}{item.entry.maxKind ? <Image resizeMode="contain" source={{ uri: absoluteUri(assetBaseUrl, `/images/${item.entry.maxKind}.png`) }} style={styles.maxIcon} /> : null}</View><View style={styles.cardIdentity}><Text numberOfLines={2} style={[styles.name, light && styles.textLight]}>{item.entry.name}</Text>{showCollectionFilters && personalLabels.length > 0 ? <View style={styles.personalRow}>{personalLabels.map((label) => <Text key={label} style={[styles.personal, light && styles.personalLight]}>{label}</Text>)}</View> : null}</View></View></View><View style={styles.countBlock}><Text style={[styles.count, light && styles.textLight]}>{countLabel}</Text><View style={[styles.track, light && styles.trackLight]}><View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} /></View><Text style={[styles.openLabel, light && styles.accentLight]}>{openLabel}  →</Text></View></Pressable>;
  }} /></View>;
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c1112' }, rootLight: { backgroundColor: '#f5f2e9' }, textLight: { color: '#132d32' }, mutedLight: { color: '#405b56' }, accentLight: { color: '#08766b' }, panelLight: { borderColor: 'rgba(21,117,119,0.30)', backgroundColor: '#fffdf7' }, controlLight: { borderColor: 'rgba(21,117,119,0.30)', backgroundColor: '#fffdf7' }, inputLight: { borderColor: 'rgba(21,117,119,0.36)', backgroundColor: '#fffdf7' },
  productHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }, productHeaderCompact: { minHeight: 110, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: 'rgba(66,215,196,0.3)' }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(142,197,201,0.34)', borderRadius: 21, backgroundColor: '#141a1b' }, backText: { marginTop: -4, color: '#f4ffff', fontSize: 37, lineHeight: 39 }, productIcon: { width: 42, height: 42 }, productIconCompact: { marginTop: 11 }, headerCopy: { minWidth: 0, flex: 1 }, headerCopyCompact: { marginTop: 11 }, eyebrow: { color: '#8ec5c9', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#f4ffff', fontSize: 25, fontWeight: '900', lineHeight: 29 }, population: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 66, paddingHorizontal: 7, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 7, backgroundColor: 'rgba(66,215,196,0.07)' }, populationCompact: { position: 'absolute', left: 2, bottom: 10, minWidth: 49 }, populationLight: { borderColor: 'rgba(21,117,119,0.3)', backgroundColor: 'rgba(27,185,173,0.08)' }, populationIcon: { color: '#42d7c4', fontSize: 16 }, populationValue: { color: '#f4ffff', fontSize: 14, fontWeight: '900', lineHeight: 15 }, populationLabel: { color: '#9eb9bb', fontSize: 7, fontWeight: '900' }, populationLabelCompact: { display: 'none' },
  segment: { flexDirection: 'row', gap: 4, marginTop: 8, padding: 4, borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 8, backgroundColor: '#101617' }, segmentCompact: { marginTop: 12 }, segmentButton: { minHeight: 46, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 5 }, segmentActive: { backgroundColor: '#42d7c4' }, segmentIcon: { color: '#9eb9bb', fontSize: 14 }, segmentText: { color: '#9eb9bb', fontSize: 13, fontWeight: '900' }, segmentTextActive: { color: '#071312' },
  search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(157,190,193,0.42)', borderRadius: 7, backgroundColor: '#111718' }, searchIcon: { color: '#42d7c4', fontSize: 25 }, searchInput: { minWidth: 0, flex: 1, paddingVertical: 0, color: '#f4ffff', fontSize: 14 }, clearSearch: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, clearSearchText: { color: '#9eb9bb', fontSize: 24 },
  context: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, paddingHorizontal: 4, paddingVertical: 10 }, contextPrimary: { minWidth: 0, flex: 1, gap: 2 }, contextLabel: { color: '#8ec5c9', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, contextTitle: { color: '#f4ffff', fontSize: 12, fontWeight: '800', lineHeight: 17 }, contextMeta: { width: 122, color: '#9eb9bb', fontSize: 9, fontWeight: '700', lineHeight: 13, textAlign: 'right' },
  filters: { gap: 5, padding: 5, borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 8, backgroundColor: 'rgba(16,22,23,0.72)' }, filterLabel: { paddingHorizontal: 2, color: '#9eb9bb', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }, filterGrid: { flexDirection: 'row', gap: 3 }, filterButton: { minWidth: 0, minHeight: 43, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 2, borderWidth: 1, borderColor: 'rgba(157,190,193,0.38)', borderRadius: 5, backgroundColor: 'transparent' }, filterIcon: { width: 15, height: 15, resizeMode: 'contain' }, filterText: { color: '#9eb9bb', fontSize: 10, fontWeight: '900' }, categoryActive: { borderColor: '#f5cd59', backgroundColor: '#f5cd59' }, categoryActiveText: { color: '#141006' }, personalFilter: { justifyContent: 'space-between', paddingHorizontal: 4 }, personalActive: { borderColor: '#42d7c4', backgroundColor: '#42d7c4' }, personalActiveText: { color: '#071312' }, filterCount: { minWidth: 19, minHeight: 19, paddingHorizontal: 3, color: '#9eb9bb', backgroundColor: 'rgba(159,191,193,0.10)', borderRadius: 4, fontSize: 8, fontWeight: '900', lineHeight: 19, textAlign: 'center' }, filterCountLight: { color: '#405b56', backgroundColor: 'rgba(21,117,119,0.10)' }, personalCountActive: { color: '#071312', backgroundColor: 'rgba(7,19,18,0.14)' }, filterDivider: { height: 1, marginTop: 1, backgroundColor: 'rgba(159,191,193,0.13)' }, filterDividerLight: { backgroundColor: 'rgba(21,117,119,0.13)' },
  summary: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }, summaryText: { minWidth: 0, flex: 1, color: '#9eb9bb', fontSize: 11, fontWeight: '800' }, summaryCount: { color: '#f4ffff', fontWeight: '900' }, summaryDot: { color: 'rgba(158,185,187,0.55)' }, clearFilters: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#42d7c4', borderRadius: 5 }, clearFiltersText: { color: '#42d7c4', fontSize: 10, fontWeight: '900' },
  state: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 8, backgroundColor: '#141a1b' }, stateCopy: { color: '#9eb9bb', fontSize: 12, fontWeight: '700', lineHeight: 18, textAlign: 'center' }, error: { gap: 8, marginVertical: 8, padding: 16, borderWidth: 1, borderColor: '#df5770', borderRadius: 8, backgroundColor: '#39151e' }, errorLight: { backgroundColor: '#fff0f2' }, errorTitle: { color: '#ffd8df', fontSize: 17, fontWeight: '900' }, errorTitleLight: { color: '#8e2437' }, errorCopy: { color: '#ffb8c4', fontSize: 12, lineHeight: 18 }, errorCopyLight: { color: '#7e3341' }, retry: { minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 6, backgroundColor: '#df5770' }, retryText: { color: '#fff', fontWeight: '900' }, stale: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, padding: 10, borderWidth: 1, borderColor: 'rgba(242,207,98,0.48)', borderRadius: 6, backgroundColor: 'rgba(242,207,98,0.08)' }, staleLight: { backgroundColor: 'rgba(194,143,21,0.10)' }, staleText: { minWidth: 0, flex: 1, color: '#9eb9bb', fontSize: 10, fontWeight: '700', lineHeight: 15 }, staleRetry: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: '#f5cd59', borderRadius: 5 }, staleRetryText: { color: '#f4ffff', fontSize: 10, fontWeight: '900' },
  card: { minHeight: 116, gap: 6, padding: 8, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(66,215,196,0.3)', backgroundColor: '#141a1b' }, cardLight: { borderColor: 'rgba(21,117,119,0.3)', backgroundColor: '#fffdf7' }, cardAlternate: { backgroundColor: '#171e1f' }, cardAlternateLight: { backgroundColor: '#f8f8f2' }, pressed: { opacity: 0.72 }, cardOverview: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 }, rank: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 18 }, rankText: { color: '#42d7c4', fontSize: 13, fontWeight: '900' }, rankTextMedal: { color: '#17130a' }, pokemonSummary: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }, artworkStage: { position: 'relative', width: 67, height: 67, alignItems: 'center', justifyContent: 'center' }, artwork: { width: 72, height: 72 }, maxIcon: { position: 'absolute', right: -1, top: 0, width: 19, height: 19 }, cardIdentity: { minWidth: 0, flex: 1 }, name: { color: '#f4ffff', fontSize: 15, fontWeight: '900', lineHeight: 18 }, personalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 4 }, personal: { paddingHorizontal: 5, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(66,215,196,0.35)', borderRadius: 4, color: '#9eb9bb', backgroundColor: 'rgba(66,215,196,0.07)', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }, personalLight: { color: '#405b56' }, countBlock: { minWidth: 0, marginLeft: 41, gap: 4 }, count: { color: '#f4ffff', fontSize: 11, fontWeight: '900' }, track: { height: 5, overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(159,191,193,0.14)' }, trackLight: { backgroundColor: 'rgba(21,117,119,0.13)' }, fill: { height: '100%', borderRadius: 3, backgroundColor: '#42d7c4' }, openLabel: { alignSelf: 'flex-start', color: '#42d7c4', fontSize: 9, fontWeight: '900' },
  empty: { alignItems: 'center', gap: 7, padding: 32, borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', backgroundColor: '#141a1b' }, emptyIcon: { color: '#42d7c4', fontSize: 28 }, emptyTitle: { color: '#f4ffff', fontSize: 16, fontWeight: '900', textAlign: 'center' }, emptyAction: { minHeight: 40, justifyContent: 'center', marginTop: 4, paddingHorizontal: 13, borderRadius: 6, backgroundColor: '#42d7c4' }, emptyActionText: { color: '#071312', fontSize: 11, fontWeight: '900' }, snapshotFooter: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }, snapshotText: { flex: 1, color: '#9eb9bb', fontSize: 10, fontWeight: '700' }, refresh: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 5 }, refreshText: { color: '#42d7c4', fontSize: 23, fontWeight: '800' }, disabled: { opacity: 0.55 }, method: { overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(66,215,196,0.3)', borderRadius: 7, backgroundColor: '#141a1b' }, methodSummary: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11 }, methodInfo: { color: '#42d7c4', fontSize: 17 }, methodTitle: { flex: 1, color: '#9eb9bb', fontSize: 12, fontWeight: '900' }, methodChevron: { color: '#9eb9bb', fontSize: 17 }, methodBody: { gap: 8, padding: 11, borderTopWidth: 1, borderColor: 'rgba(66,215,196,0.3)' }, methodBodyLight: { borderColor: 'rgba(21,117,119,0.3)' }, methodCopy: { color: '#9eb9bb', fontSize: 11, lineHeight: 16 }, methodStrong: { color: '#f4ffff', fontWeight: '900' },
  emptyParity: { minHeight: 157, justifyContent: 'center', marginTop: 10 },
});

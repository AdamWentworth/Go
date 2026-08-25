import type { Coordinates } from '@pokemongonexus/shared-contracts/location';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonSearchQueryParams } from '@pokemongonexus/shared-contracts/search';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import type { NativePokemonSearchResult } from '../features/search/pokemonSearchModel';
import {
  countNativePokemonSearchFilters,
  createNativePokemonSearchDraft,
  prepareNativePokemonSearch,
  type NativePokemonSearchDraft,
} from '../features/search/nativePokemonSearchDraft';
import {
  NativePokemonSearchFilterSheet,
  type NativeSearchFilterSection,
} from '../features/search/NativePokemonSearchFilterSheet';
import { NativeSearchMapView } from '../features/search/NativeSearchMapView';

type SavedLocation = Coordinates & { label: string };

type Props = {
  assetBaseUrl: string;
  catalog: BasePokemon[];
  draft: NativePokemonSearchDraft;
  error?: string | null;
  hasSearched?: boolean;
  initialDisplayMode?: 'list' | 'map';
  isLoading?: boolean;
  initialScrollOffset?: number;
  notice?: string | null;
  onDisplayModeChange?: (mode: 'list' | 'map') => void;
  onDraftChange: (draft: NativePokemonSearchDraft) => void;
  onOpenListing: (result: NativePokemonSearchResult) => void;
  onOpenProfile: (username: string) => void;
  onSearch: (
    query: PokemonSearchQueryParams,
    draft: NativePokemonSearchDraft,
  ) => void;
  onRetry?: () => void;
  onScrollOffsetChange?: (offset: number) => void;
  results: NativePokemonSearchResult[];
  savedLocation?: SavedLocation | null;
};

const modeLabel = (mode: NativePokemonSearchResult['mode']): string => (
  mode === 'trade' ? 'For Trade' : mode === 'wanted' ? 'Wanted' : 'Caught'
);

const distanceLabel = (distance: number | null): string | null => {
  if (distance == null) return null;
  return distance <= 0.01 ? 'Nearby' : `${distance.toFixed(1)} km away`;
};

const absoluteUri = (value: string | null | undefined, origin: string): string | null => {
  if (!value) return null;
  try { return new URL(value, origin).toString(); } catch { return null; }
};

const SearchArtwork = ({
  assetBaseUrl,
  backgroundUri,
  imageUri,
  light,
  maxKind,
  size = 'large',
}: {
  assetBaseUrl: string;
  backgroundUri: string | null;
  imageUri: string | null;
  light: boolean;
  maxKind: 'dynamax' | 'gigantamax' | null;
  size?: 'large' | 'small';
}) => (
  <View style={[styles.artwork, light && styles.artworkLight, size === 'small' && styles.artworkSmall]}>
    {backgroundUri ? <Image resizeMode="cover" source={{ uri: backgroundUri }} style={StyleSheet.absoluteFill} /> : null}
    {imageUri ? <Image resizeMode="contain" source={{ uri: imageUri }} style={styles.artworkPokemon} /> : <Text style={styles.imageFallback}>No image</Text>}
    {maxKind ? (
      <Image
        resizeMode="contain"
        source={{ uri: `${assetBaseUrl.replace(/\/$/, '')}/images/${maxKind}.png` }}
        style={[styles.artworkMax, size === 'small' && styles.artworkMaxSmall]}
      />
    ) : null}
  </View>
);

const ResultCard = ({
  assetBaseUrl,
  light,
  onOpenListing,
  onOpenProfile,
  result,
}: {
  assetBaseUrl: string;
  light: boolean;
  onOpenListing: (result: NativePokemonSearchResult) => void;
  onOpenProfile: (username: string) => void;
  result: NativePokemonSearchResult;
}) => {
  const accent = result.mode === 'trade' ? '#35c680' : result.mode === 'wanted' ? '#f25f78' : '#2f9cff';
  const relatedTitle = result.mode === 'trade' ? 'Trainer wants' : 'Trainer can offer';
  return (
    <View style={[styles.resultCard, light && styles.resultCardLight, { borderTopColor: accent }]}>
      <View style={[styles.resultHeader, { backgroundColor: `${accent}12` }]}>
        <View style={[styles.trainerAvatar, { borderColor: accent }]}>
          <Text style={[styles.trainerAvatarText, { color: accent }]}>{result.username.slice(0, 1).toLocaleUpperCase()}</Text>
        </View>
        <View style={styles.resultHeaderCopy}>
          <Text style={[styles.listingType, { color: accent }]}>{modeLabel(result.mode).toLocaleUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.trainerName, light && styles.textLight]}>{result.username}</Text>
        </View>
        {distanceLabel(result.distanceKm) ? <Text style={[styles.distance, light && styles.secondaryLight]}>⌖ {distanceLabel(result.distanceKm)}</Text> : null}
      </View>
      <View style={styles.listingBody}>
        <SearchArtwork
          assetBaseUrl={assetBaseUrl}
          backgroundUri={result.row.locationBackgroundUri}
          imageUri={result.row.imageUri}
          light={light}
          maxKind={result.row.maxKind}
        />
        <Text numberOfLines={3} style={[styles.listingName, light && styles.textLight]}>{result.row.name}</Text>
      </View>
      {result.relatedRows.length > 0 ? (
        <View style={[styles.related, { borderColor: `${accent}66`, backgroundColor: `${accent}0c` }]}>
          <View style={styles.relatedHeader}>
            <View>
              <Text style={[styles.relatedEyebrow, { color: accent }]}>TRADE COMPATIBILITY</Text>
              <Text style={[styles.relatedTitle, light && styles.textLight]}>{relatedTitle}</Text>
            </View>
            <Text style={[styles.relatedCount, { backgroundColor: `${accent}36`, color: accent }]}>{result.relatedRows.length}</Text>
          </View>
          <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
            {result.relatedRows.map((row) => (
              <View key={row.id} style={[styles.relatedCard, light && styles.relatedCardLight, row.match && { borderColor: accent }]}>
                <SearchArtwork assetBaseUrl={assetBaseUrl} backgroundUri={row.locationBackgroundUri} imageUri={row.imageUri} light={light} maxKind={row.maxKind} size="small" />
                <Text numberOfLines={3} style={[styles.relatedName, light && styles.textLight]}>{row.name}</Text>
                {row.match ? <Text style={[styles.matchLabel, { color: accent }]}>MUTUAL MATCH</Text> : null}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => onOpenProfile(result.username)} style={[styles.secondaryButton, light && styles.secondaryButtonLight]}>
          <Text style={[styles.secondaryButtonText, light && styles.textLight]}>View trainer</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpenListing(result)} style={[styles.primaryButton, { backgroundColor: accent }]}>
          <Text style={styles.primaryButtonText}>{result.mode === 'caught' ? 'View Pokémon' : 'Open listing'}  →</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const NativePokemonSearchScreen = ({
  assetBaseUrl,
  catalog,
  draft,
  error = null,
  hasSearched = false,
  initialDisplayMode = 'list',
  isLoading = false,
  initialScrollOffset = 0,
  notice = null,
  onDisplayModeChange,
  onDraftChange,
  onOpenListing,
  onOpenProfile,
  onSearch,
  onRetry,
  onScrollOffsetChange,
  results,
  savedLocation = null,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSection, setFilterSection] = useState<NativeSearchFilterSection>('pokemon');
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterNotice, setFilterNotice] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'list' | 'map'>(initialDisplayMode);
  const listRef = useRef<FlatList<NativePokemonSearchResult>>(null);
  const restoredScrollRef = useRef(initialScrollOffset <= 0);
  const latestScrollOffsetRef = useRef(initialScrollOffset);
  const selectedPokemon = useMemo(() => catalog.find((pokemon) => (
    pokemon.pokemon_id === draft.pokemonId && (pokemon.form ?? null) === draft.form
  )) ?? catalog.find((pokemon) => pokemon.pokemon_id === draft.pokemonId) ?? null, [catalog, draft.form, draft.pokemonId]);
  const filterCount = countNativePokemonSearchFilters(draft);

  const restoreScrollPosition = useCallback(() => {
    if (restoredScrollRef.current || initialScrollOffset <= 0 || isLoading) return;
    restoredScrollRef.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ animated: false, offset: initialScrollOffset });
    });
  }, [initialScrollOffset, isLoading]);

  const reportScrollPosition = () => {
    onScrollOffsetChange?.(latestScrollOffsetRef.current);
  };

  const changeDisplayMode = (mode: 'list' | 'map') => {
    setDisplayMode(mode);
    onDisplayModeChange?.(mode);
  };

  const openFilters = (section: NativeSearchFilterSection = 'pokemon') => {
    setFilterError(null);
    setFilterSection(section);
    setFiltersOpen(true);
  };
  const runSearch = () => {
    const prepared = prepareNativePokemonSearch(draft, selectedPokemon);
    if (!prepared.ok) {
      setFilterSection(prepared.section);
      setFilterError(prepared.message);
      setFiltersOpen(true);
      return;
    }
    setFilterError(null);
    setFiltersOpen(false);
    onSearch(prepared.query, draft);
  };

  return (
    <Fragment>
      <FlatList
      contentContainerStyle={styles.content}
      data={!isLoading && !error && displayMode === 'list' ? results : []}
      onContentSizeChange={restoreScrollPosition}
      onMomentumScrollEnd={reportScrollPosition}
      onScroll={(event) => { latestScrollOffsetRef.current = event.nativeEvent.contentOffset.y; }}
      onScrollEndDrag={reportScrollPosition}
      ref={listRef}
      scrollEventThrottle={100}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(result) => result.id}
      ListHeaderComponent={(
        <>
          {selectedPokemon ? (
            <View style={[styles.summary, light && styles.summaryLight]}>
              <View style={styles.summaryImageFrame}>
                <Image
                  resizeMode="contain"
                  source={{ uri: absoluteUri(selectedPokemon.image_url, assetBaseUrl) ?? selectedPokemon.image_url }}
                  style={styles.summaryImage}
                />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryEyebrow}>CURRENT SEARCH</Text>
                <Text numberOfLines={2} style={[styles.summaryTitle, light && styles.textLight]}>{[
                  draft.shiny ? 'Shiny' : '',
                  draft.shadow ? 'Shadow' : '',
                  draft.gigantamax ? 'Gigantamax' : draft.dynamax ? 'Dynamax' : '',
                  selectedPokemon.name,
                ].filter(Boolean).join(' ')}</Text>
                <View style={styles.summaryChips}>
                  <Text style={styles.modeChip}>{modeLabel(draft.ownership)}</Text>
                  <Text style={[styles.neutralChip, light && styles.neutralChipLight]}>⌖ {draft.city || 'Choose location'}</Text>
                  {filterCount ? <Text style={[styles.neutralChip, light && styles.neutralChipLight]}>☷ {filterCount} filters</Text> : null}
                </View>
              </View>
              <Pressable accessibilityRole="button" onPress={() => openFilters()} style={styles.modifyButton}>
                <Text style={styles.modifyButtonText}>Modify</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.start, light && styles.summaryLight]}>
              <Text style={styles.startIcon}>◉</Text>
              <Text style={[styles.startTitle, light && styles.textLight]}>Find your next Pokémon</Text>
              <Text style={[styles.startCopy, light && styles.secondaryLight]}>Choose a Pokémon, location, and listing type to discover nearby trainers.</Text>
              <Pressable accessibilityRole="button" onPress={() => openFilters('pokemon')} style={styles.startButton}>
                <Text style={styles.startButtonText}>Choose search filters</Text>
              </Pressable>
            </View>
          )}
          {selectedPokemon ? (
            <Pressable accessibilityRole="button" disabled={isLoading} onPress={runSearch} style={[styles.searchButton, isLoading && styles.disabled]}>
              <Text style={styles.searchButtonText}>{isLoading ? 'Searching…' : 'Search community listings'}</Text>
            </Pressable>
          ) : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
          {error ? (
            <View accessibilityLiveRegion="assertive" style={styles.errorState}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={[styles.stateTitle, light && styles.textLight]}>Search couldn’t be completed</Text>
              <Text style={[styles.stateCopy, light && styles.secondaryLight]}>{error}</Text>
              {onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable> : null}
            </View>
          ) : null}
          {isLoading ? (
            <View accessibilityLiveRegion="polite" style={[styles.loadingState, light && styles.summaryLight]}>
              <ActivityIndicator color="#2f9cff" size="large" />
              <Text style={[styles.stateTitle, light && styles.textLight]}>Searching community listings</Text>
              <Text style={[styles.stateCopy, light && styles.secondaryLight]}>Checking nearby trainers for the Pokémon you selected…</Text>
            </View>
          ) : null}
          {!isLoading && !error && hasSearched && results.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <View>
                  <Text style={styles.resultsComplete}>✓ SEARCH COMPLETE</Text>
                  <Text style={[styles.resultsTitle, light && styles.textLight]}>{modeLabel(draft.ownership)} {draft.ownership === 'caught' ? 'Pokémon' : 'listings'}</Text>
                </View>
                <Text style={[styles.resultsCount, light && styles.neutralChipLight]}>{results.length} results</Text>
              </View>
              <View accessibilityRole="tablist" style={[styles.displayModes, light && styles.displayModesLight]}>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: displayMode === 'list' }}
                  onPress={() => changeDisplayMode('list')}
                  style={[styles.displayMode, displayMode === 'list' && styles.displayModeActive]}
                >
                  <Text style={[styles.displayModeText, light && styles.secondaryLight, displayMode === 'list' && styles.displayModeTextActive]}>☷  List</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: displayMode === 'map' }}
                  onPress={() => changeDisplayMode('map')}
                  style={[styles.displayMode, displayMode === 'map' && styles.displayModeActive]}
                >
                  <Text style={[styles.displayModeText, light && styles.secondaryLight, displayMode === 'map' && styles.displayModeTextActive]}>⌖  Map</Text>
                </Pressable>
              </View>
              {displayMode === 'map' ? (
                <NativeSearchMapView
                  onOpenListing={onOpenListing}
                  onOpenProfile={onOpenProfile}
                  results={results}
                />
              ) : null}
            </>
          ) : null}
          {!isLoading && !error && hasSearched && results.length === 0 ? (
            <View style={[styles.loadingState, light && styles.summaryLight]}>
              <Text style={styles.startIcon}>⌕</Text>
              <Text style={[styles.stateTitle, light && styles.textLight]}>No listings fit these filters</Text>
              <Text style={[styles.stateCopy, light && styles.secondaryLight]}>Try a larger distance, fewer variant details, or another listing type.</Text>
              <Pressable accessibilityRole="button" onPress={() => openFilters()} style={styles.retryButton}><Text style={styles.retryText}>Modify filters</Text></Pressable>
            </View>
          ) : null}
        </>
      )}
      renderItem={({ item }) => (
        <ResultCard assetBaseUrl={assetBaseUrl} light={light} onOpenListing={onOpenListing} onOpenProfile={onOpenProfile} result={item} />
      )}
      style={[styles.screen, light && styles.screenLight]}
      testID="native-pokemon-search"
      />
      {filtersOpen ? (
        <NativePokemonSearchFilterSheet
          assetBaseUrl={assetBaseUrl}
          catalog={catalog}
          draft={draft}
          error={filterError}
          initialSection={filterSection}
          isSearching={isLoading}
          key={`${filterSection}:${filterError ?? 'clean'}`}
          notice={filterNotice}
          onApply={runSearch}
          onChange={onDraftChange}
          onClose={() => setFiltersOpen(false)}
          onNotice={setFilterNotice}
          onReset={() => onDraftChange(createNativePokemonSearchDraft(savedLocation ? {
            city: savedLocation.label,
            latitude: savedLocation.latitude,
            longitude: savedLocation.longitude,
          } : {}))}
          savedLocation={savedLocation}
          visible
        />
      ) : null}
    </Fragment>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#080d0f' },
  screenLight: { backgroundColor: '#eef4f5' },
  content: { width: '100%', maxWidth: 840, alignSelf: 'center', padding: 10, paddingBottom: 110 },
  summary: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: '#4c5d61', borderRadius: 13, backgroundColor: '#202527' },
  summaryLight: { borderColor: '#b4c1c3', backgroundColor: '#ffffff' },
  summaryImageFrame: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#5b696c', borderRadius: 11, backgroundColor: '#171d1f' },
  summaryImage: { width: '88%', height: '88%' },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryEyebrow: { color: '#2f9cff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  summaryTitle: { marginTop: 2, color: '#f7fbfc', fontSize: 16, fontWeight: '900' },
  summaryChips: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  modeChip: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, color: '#71e4b0', fontSize: 10, fontWeight: '900', borderWidth: 1, borderColor: '#2e9e6a', borderRadius: 999, backgroundColor: '#163a2b' },
  neutralChip: { overflow: 'hidden', maxWidth: 170, paddingHorizontal: 7, paddingVertical: 3, color: '#c1ccce', fontSize: 10, fontWeight: '800', borderWidth: 1, borderColor: '#59686b', borderRadius: 999 },
  neutralChipLight: { color: '#435154', borderColor: '#a8b5b7', backgroundColor: '#f4f7f7' },
  modifyButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#2f9cff', borderRadius: 9, backgroundColor: '#153d66' },
  modifyButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  start: { alignItems: 'center', gap: 7, padding: 24, borderWidth: 1, borderColor: '#35484c', borderRadius: 14, backgroundColor: '#151d1f' },
  startIcon: { color: '#2f9cff', fontSize: 31 },
  startTitle: { color: '#f7fbfc', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  startCopy: { maxWidth: 430, color: '#a4b0b2', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  startButton: { minHeight: 48, marginTop: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 9, backgroundColor: '#2f9cff' },
  startButtonText: { color: '#05131e', fontWeight: '900' },
  searchButton: { minHeight: 50, marginTop: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#138cff' },
  searchButtonText: { color: '#04131f', fontSize: 14, fontWeight: '900' },
  notice: { marginTop: 9, padding: 9, color: '#c9fff3', textAlign: 'center', borderWidth: 1, borderColor: '#27866e', borderRadius: 8, backgroundColor: '#123128' },
  errorState: { marginTop: 10, alignItems: 'center', gap: 6, padding: 20, borderWidth: 1, borderColor: '#b94e61', borderRadius: 13, backgroundColor: '#361a22' },
  errorIcon: { color: '#ff6e83', fontSize: 28, fontWeight: '900' },
  loadingState: { marginTop: 10, alignItems: 'center', gap: 7, padding: 25, borderWidth: 1, borderColor: '#34484c', borderRadius: 13, backgroundColor: '#141c1e' },
  stateTitle: { color: '#f6fafb', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  stateCopy: { color: '#a6b1b3', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { minHeight: 44, marginTop: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 9, backgroundColor: '#2f9cff' },
  retryText: { color: '#06131f', fontWeight: '900' },
  resultsHeader: { marginTop: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
  displayModes: { alignSelf: 'flex-end', flexDirection: 'row', gap: 3, marginBottom: 9, padding: 3, borderWidth: 1, borderColor: '#435458', borderRadius: 11, backgroundColor: '#111719' },
  displayModesLight: { borderColor: '#b1bec0', backgroundColor: '#ffffff' },
  displayMode: { minWidth: 80, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  displayModeActive: { backgroundColor: '#123a61' },
  displayModeText: { color: '#9ba8aa', fontSize: 13, fontWeight: '900' },
  displayModeTextActive: { color: '#ffffff' },
  resultsComplete: { color: '#2f9cff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  resultsTitle: { color: '#f7fbfc', fontSize: 19, fontWeight: '900' },
  resultsCount: { marginLeft: 'auto', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4, color: '#c2ccce', fontSize: 11, borderWidth: 1, borderColor: '#59686b', borderRadius: 999 },
  resultCard: { marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderTopWidth: 3, borderColor: '#385055', borderRadius: 14, backgroundColor: '#141c1e' },
  resultCardLight: { borderColor: '#aebdc0', backgroundColor: '#ffffff' },
  resultHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10, borderBottomWidth: 1, borderBottomColor: '#34484c' },
  trainerAvatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 20 },
  trainerAvatarText: { fontSize: 16, fontWeight: '900' },
  resultHeaderCopy: { flex: 1, minWidth: 0 },
  listingType: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  trainerName: { color: '#f6fafb', fontSize: 16, fontWeight: '900' },
  distance: { maxWidth: 110, color: '#a9b5b7', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  listingBody: { alignItems: 'center', padding: 12 },
  artwork: { width: 180, height: 150, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#0d1416' },
  artworkLight: { backgroundColor: '#f4f8f8' },
  artworkSmall: { width: 102, height: 88 },
  artworkPokemon: { width: '86%', height: '86%' },
  artworkMax: { position: 'absolute', width: 42, height: 42, top: 11, right: 12 },
  artworkMaxSmall: { width: 26, height: 26, top: 5, right: 5 },
  imageFallback: { color: '#829194', fontSize: 11 },
  listingName: { marginTop: 7, color: '#f6fafb', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  related: { marginHorizontal: 10, padding: 10, borderWidth: 1, borderRadius: 11 },
  relatedHeader: { flexDirection: 'row', alignItems: 'center' },
  relatedEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  relatedTitle: { color: '#f0f6f7', fontSize: 15, fontWeight: '900' },
  relatedCount: { marginLeft: 'auto', overflow: 'hidden', minWidth: 32, paddingHorizontal: 7, paddingVertical: 5, fontSize: 11, fontWeight: '900', textAlign: 'center', borderRadius: 999 },
  relatedScroll: { gap: 8, paddingTop: 9, paddingBottom: 2 },
  relatedCard: { width: 118, minHeight: 146, alignItems: 'center', padding: 7, borderWidth: 1, borderColor: '#405155', borderRadius: 9, backgroundColor: '#101719' },
  relatedCardLight: { borderColor: '#aebdc0', backgroundColor: '#ffffff' },
  relatedName: { marginTop: 5, color: '#f0f6f7', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  matchLabel: { marginTop: 'auto', paddingTop: 4, fontSize: 8, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8, padding: 10 },
  secondaryButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#596a6d', borderRadius: 9 },
  secondaryButtonLight: { borderColor: '#89999c' },
  secondaryButtonText: { color: '#ecf3f4', fontSize: 12, fontWeight: '900' },
  primaryButton: { flex: 1.15, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  primaryButtonText: { color: '#04130d', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  textLight: { color: '#172124' },
  secondaryLight: { color: '#566467' },
});

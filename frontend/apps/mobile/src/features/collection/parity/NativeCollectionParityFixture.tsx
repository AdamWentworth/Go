import {
  ActivityIndicator,
  FlatList,
  Image,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  collectionParityTokens,
  webCssVarTokens,
} from '@pokemongonexus/shared-ui-tokens';
import type {
  CollectionParityCardFixture,
  CollectionParityTheme,
} from './collectionParityFixtures';
import type { NativeCollectionRow } from '../collectionModel';
import { COLLECTION_PARITY_FIXTURES } from './collectionParityFixtures';
import {
  projectNativeCollectionParityCard,
} from './nativeCollectionCardProjection';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../NativePokemonHubHeader';
import { NativePokemonStatusGlow } from './NativePokemonStatusGlow';
import { NativePokemonLocationBackdrop } from './NativePokemonLocationBackdrop';
import {
  NativeCollectionSearchControls,
  NativeCollectionSearchMenu,
} from './NativeCollectionSearchControls';
import { NativeCollectionPriorityStar } from './NativeCollectionPriorityStar';
import { NativeActionMenuAnchor } from '../../../components/NativeActionMenuAnchor';
import {
  toNativeCollectionAssetUrl,
  toNativeCollectionImageSource,
} from './nativeCollectionImageSource';

type NativeCollectionParityFixtureProps = {
  assetBaseUrl?: string;
  activeTag?: string | null;
  cards?: CollectionParityCardFixture[];
  collectionRows?: NativeCollectionRow[];
  collectionCount?: number;
  customTagColor?: string;
  error?: string | null;
  isLoading?: boolean;
  onActionMenuPress?: () => void;
  onCardPress?: (card: CollectionParityCardFixture) => void;
  onCardLongPress?: (card: CollectionParityCardFixture) => void;
  onCollectionRowPress?: (row: NativeCollectionRow) => void;
  onCollectionRowLongPress?: (row: NativeCollectionRow) => void;
  onClearTag?: () => void;
  onQueryChange?: (query: string) => void;
  onToggleEvolutionaryLine?: () => void;
  onPokemonPress?: () => void;
  onRetry?: () => void;
  onSortPress?: () => void;
  onTagsPress?: () => void;
  onWishlistPress?: () => void;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onSelectionActionPress?: () => void;
  activeView?: NativePokemonHubView;
  query?: string;
  initialScrollOffset?: number;
  onScrollOffsetChange?: (offset: number) => void;
  scrollResetKey?: string;
  sortDirection?: 'ascending' | 'descending';
  sortIconPath?: string;
  sortLabel?: string;
  showEvolutionaryLine?: boolean;
  tagCanClear?: boolean;
  tagTone?: 'caught' | 'trade' | 'favorites' | 'wanted' | 'most-wanted' | 'custom';
  theme?: CollectionParityTheme;
  showHeader?: boolean;
  showOwnership?: boolean;
  selectedIds?: ReadonlySet<string>;
  selectionAction?: 'add' | 'organize';
};

export type NativeCollectionParityFixtureHandle = {
  resetScroll: () => void;
};

const LIGHT = {
  background: collectionParityTokens.colors.light.page,
  text: collectionParityTokens.colors.light.textPrimary,
  secondaryText: collectionParityTokens.colors.light.textSecondary,
  headerInactive: collectionParityTokens.colors.light.headerInactive,
  search: collectionParityTokens.colors.light.searchSurface,
  searchText: collectionParityTokens.colors.light.searchText,
  tagText: collectionParityTokens.colors.light.tagTitle,
};

const DARK = {
  background: webCssVarTokens.colors.bgApp,
  text: webCssVarTokens.colors.textPrimary,
  secondaryText: collectionParityTokens.colors.dark.textSecondary,
  headerInactive: collectionParityTokens.colors.dark.headerInactive,
  search: '#fff',
  searchText: '#111',
  tagText: '#fff',
};

const GRID_GAP = collectionParityTokens.grid.gap;
const GRID_HORIZONTAL_PADDING = collectionParityTokens.grid.horizontalPadding;

const TAG_TONES = {
  caught: {
    accent: '#3f89ff',
    contrast: '#ffffff',
    surface: 'rgba(63, 137, 255, 0.18)',
  },
  trade: {
    accent: '#3aa85f',
    contrast: '#ffffff',
    surface: 'rgba(58, 168, 95, 0.18)',
  },
  favorites: {
    accent: '#ffd45a',
    contrast: '#171106',
    surface: 'rgba(255, 212, 90, 0.18)',
  },
  wanted: {
    accent: '#dd5260',
    contrast: '#ffffff',
    surface: 'rgba(221, 82, 96, 0.18)',
  },
  'most-wanted': {
    accent: '#ff6f61',
    contrast: '#ffffff',
    surface: 'rgba(255, 111, 97, 0.18)',
  },
  custom: {
    accent: '#1db5d1',
    contrast: '#071014',
    surface: 'rgba(29, 181, 209, 0.18)',
  },
} as const;

const customTagSurface = (color: string): string =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}2e` : TAG_TONES.custom.surface;

const EMPTY_SELECTED_IDS: ReadonlySet<string> = new Set<string>();
// React Native 0.86 implements this FlatList renderer memoization flag in the
// runtime before it appears in the public TypeScript declaration. A spread
// keeps the optimization isolated and removable when the declaration catches
// up, while preventing data-only tag swaps from rebuilding the row renderer.
const NATIVE_FLAT_LIST_RENDERER_OPTIMIZATION = { strictMode: true } as const;
// FlatList turns `numColumns` data into virtual rows before applying these
// budgets. Twelve therefore meant twelve rows (36 cards on a phone), and that
// entire permanently pinned first batch had to reconcile on every tag swap.
// Six rows still cover even a tall phone/tablet collection viewport, while
// bounding the synchronous destination update to 18 cards. The three-viewport
// window then supplies the same roughly five-row overscan Vite uses.
const COLLECTION_INITIAL_ROW_BUDGET = 6;
const COLLECTION_ROW_BATCH_BUDGET = 6;
type CollectionCardSource = CollectionParityCardFixture | NativeCollectionRow;
// FlatList combines each item key into a key for its generated multi-column
// row. Keying by Pokémon identity therefore tears down every visible native
// row whenever a tag changes its contents. Vite deliberately keys those outer
// rows by their absolute position (`row-${row}`) and reconciles the cards
// inside them. Keep the native slots stable for the same reason: tag swaps can
// update the already-mounted row views instead of remounting the entire visible
// grid while the horizontal page transition is beginning.
const collectionCardKeyExtractor = (
  _card: CollectionCardSource,
  index: number,
): string => `collection-slot-${index}`;

const isParityCardFixture = (
  source: CollectionCardSource,
): source is CollectionParityCardFixture => 'imagePath' in source;

const CollectionParityCard = memo(function CollectionParityCard({
  assetBaseUrl,
  card,
  cardWidth,
  collectionRow,
  onPressCard,
  onLongPressCard,
  onPressCollectionRow,
  onLongPressCollectionRow,
  selected,
  theme,
}: {
  assetBaseUrl: string;
  card: CollectionParityCardFixture;
  cardWidth: number;
  collectionRow?: NativeCollectionRow;
  onPressCard?: (card: CollectionParityCardFixture) => void;
  onLongPressCard?: (card: CollectionParityCardFixture) => void;
  onPressCollectionRow?: (row: NativeCollectionRow) => void;
  onLongPressCollectionRow?: (row: NativeCollectionRow) => void;
  selected: boolean;
  theme: CollectionParityTheme;
}) {
  const palette = theme === 'light' ? LIGHT : DARK;
  return (
    <Pressable
      accessibilityLabel={`${card.interaction === 'select' ? 'Select' : 'View'} ${card.name}`}
      accessibilityRole="button"
      delayLongPress={450}
      onLongPress={collectionRow && onLongPressCollectionRow
        ? () => onLongPressCollectionRow(collectionRow)
        : onLongPressCard ? () => onLongPressCard(card) : undefined}
      onPress={collectionRow && onPressCollectionRow
        ? () => onPressCollectionRow(collectionRow)
        : onPressCard ? () => onPressCard(card) : undefined}
      style={[styles.card, selected && styles.selectedCard, { width: cardWidth }]}
      testID={`parity-card-${card.id}`}
    >
      <NativePokemonStatusGlow ownership={card.ownership} />
      <View style={styles.cardTopLine}>
        <View
          accessibilityLabel={card.cp == null ? undefined : `CP ${card.cp}`}
          style={[styles.cpDisplay, card.cp == null ? styles.hidden : null]}
        >
          <Text style={[styles.cpLabel, { color: palette.text }]}>CP</Text>
          <Text style={[styles.cpValue, { color: palette.text }]}>
            {card.cp ?? '000'}
          </Text>
        </View>
        {card.favorite || card.mostWanted ? (
          <NativeCollectionPriorityStar
            label={card.favorite ? 'Favorite' : 'Most Wanted'}
            size={18}
            style={styles.priorityStar}
            tone={card.favorite ? 'favorite' : 'most-wanted'}
          />
        ) : null}
      </View>
      <View style={[styles.imageStage, cardWidth >= 145 && styles.imageStageWide]}>
        {card.locationBackgroundPath ? (
          <NativePokemonLocationBackdrop
            uri={toNativeCollectionAssetUrl(assetBaseUrl, card.locationBackgroundPath)}
          />
        ) : null}
        {card.lucky ? (
          <Image fadeDuration={0}
            accessibilityElementsHidden
            resizeMode="contain"
            source={toNativeCollectionImageSource(assetBaseUrl, '/images/lucky.png')}
            style={styles.luckyBackground}
          />
        ) : null}
        <Image fadeDuration={0}
          accessibilityLabel={card.name}
          resizeMode="contain"
          source={toNativeCollectionImageSource(assetBaseUrl, card.imagePath)}
          style={styles.pokemonImage}
        />
        {card.maxKind ? (
          <Image fadeDuration={0}
            accessibilityLabel={card.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
            resizeMode="contain"
            resizeMethod="resize"
            source={toNativeCollectionImageSource(
              assetBaseUrl,
              card.maxKind === 'gigantamax'
                ? '/images/gigantamax.png'
                : '/images/dynamax.png',
            )}
            style={styles.maxBadge}
          />
        ) : null}
        {card.purified ? (
          <Image fadeDuration={0}
            accessibilityLabel="Purified"
            resizeMode="contain"
            source={toNativeCollectionImageSource(assetBaseUrl, '/images/purified.png')}
            style={styles.purifiedBadge}
          />
        ) : null}
      </View>
      <Text style={[styles.dexNumber, { color: palette.secondaryText }]}>
        #{card.dexNumber}
      </Text>
      <View style={styles.typeIcons}>
        {card.typeIconPaths.map((path) => (
          <Image fadeDuration={0}
            accessibilityElementsHidden
            key={path}
            resizeMethod="resize"
            source={toNativeCollectionImageSource(assetBaseUrl, path)}
            style={styles.typeIcon}
          />
        ))}
      </View>
      <Text numberOfLines={2} style={[styles.name, { color: palette.text }]}>
        {card.name}
      </Text>
    </Pressable>
  );
});

export const NativeCollectionParityFixture = memo(forwardRef<
  NativeCollectionParityFixtureHandle,
  NativeCollectionParityFixtureProps
>(function NativeCollectionParityFixture({
  assetBaseUrl = 'https://pokegonexus.com',
  activeTag = 'Favorites',
  cards = COLLECTION_PARITY_FIXTURES,
  collectionRows,
  collectionCount = 168,
  customTagColor = TAG_TONES.custom.accent,
  error = null,
  isLoading = false,
  onActionMenuPress,
  onCardPress,
  onCardLongPress,
  onCollectionRowPress,
  onCollectionRowLongPress,
  onClearTag,
  onQueryChange,
  onToggleEvolutionaryLine,
  onPokemonPress,
  onRetry,
  onSortPress,
  onTagsPress,
  onWishlistPress,
  onClearSelection,
  onSelectAll,
  onSelectionActionPress,
  activeView = 'pokemon',
  query = '',
  initialScrollOffset = 0,
  onScrollOffsetChange,
  scrollResetKey = '',
  sortDirection = 'ascending',
  sortIconPath = '/images/sorting/number.png',
  sortLabel = 'Sort by Pokédex number ascending',
  showEvolutionaryLine = false,
  tagCanClear = true,
  tagTone = 'favorites',
  theme = 'dark',
  showHeader = true,
  showOwnership,
  selectedIds = EMPTY_SELECTED_IDS,
  selectionAction = 'organize',
}, ref) {
  const { width } = useWindowDimensions();
  const [searchMenuVisible, setSearchMenuVisible] = useState(false);
  const listRef = useRef<FlatList<CollectionCardSource>>(null);
  const restoredScrollRef = useRef(initialScrollOffset <= 0);
  const previousResetKeyRef = useRef(scrollResetKey);
  const currentScrollOffsetRef = useRef(initialScrollOffset);
  const collectionItems: CollectionCardSource[] = collectionRows ?? cards;
  const cardsLengthRef = useRef(collectionItems.length);
  cardsLengthRef.current = collectionItems.length;
  const resolvedShowOwnership = showOwnership ?? Boolean(activeTag);
  const palette = theme === 'light' ? LIGHT : DARK;
  const columns = width < 481 ? 3 : width < 1024 ? 6 : 9;
  const cardWidth = Math.floor(
    (width - (GRID_HORIZONTAL_PADDING * 2) - (GRID_GAP * (columns - 1))) / columns,
  );
  const baseTagColors = TAG_TONES[tagTone];
  const tagColors = tagTone === 'custom'
    ? {
        ...baseTagColors,
        accent: customTagColor,
        surface: customTagSurface(customTagColor),
      }
    : baseTagColors;
  const appendFilter = useCallback((filter: string) => {
    const nextQuery = query.trim() ? `${query}&${filter}` : filter;
    onQueryChange?.(nextQuery);
    setSearchMenuVisible(false);
  }, [onQueryChange, query]);
  const changeQuery = useCallback(
    (value: string) => onQueryChange?.(value),
    [onQueryChange],
  );
  const toggleEvolutionaryLine = useCallback(
    () => onToggleEvolutionaryLine?.(),
    [onToggleEvolutionaryLine],
  );
  const resetScroll = useCallback(() => {
    restoredScrollRef.current = true;
    if (currentScrollOffsetRef.current > 0.5) {
      listRef.current?.scrollToOffset({ animated: false, offset: 0 });
    }
    currentScrollOffsetRef.current = 0;
    onScrollOffsetChange?.(0);
  }, [onScrollOffsetChange]);
  const persistSettledScrollOffset = useCallback((
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offset = event.nativeEvent.contentOffset.y;
    currentScrollOffsetRef.current = offset;
    onScrollOffsetChange?.(offset);
  }, [onScrollOffsetChange]);
  const restoreInitialScroll = useCallback(() => {
    if (
      restoredScrollRef.current
      || initialScrollOffset <= 0
      || cardsLengthRef.current === 0
    ) return;
    restoredScrollRef.current = true;
    listRef.current?.scrollToOffset({ animated: false, offset: initialScrollOffset });
  }, [initialScrollOffset]);
  useImperativeHandle(ref, () => ({ resetScroll }), [resetScroll]);
  useLayoutEffect(() => {
    if (previousResetKeyRef.current === scrollResetKey) return;
    previousResetKeyRef.current = scrollResetKey;
    resetScroll();
  }, [resetScroll, scrollResetKey]);
  const renderCollectionControls = useCallback((includeSearchMenu: boolean) => (
    <View style={[styles.collectionControls, { backgroundColor: palette.background }]}>
      <NativeCollectionSearchControls
        assetBaseUrl={assetBaseUrl}
        inputBackground={palette.search}
        inputTextColor={palette.searchText}
        menuVisible={searchMenuVisible}
        onMenuVisibleChange={setSearchMenuVisible}
        onQueryChange={changeQuery}
        onToggleEvolutionaryLine={toggleEvolutionaryLine}
        query={query}
        showEvolutionaryLine={showEvolutionaryLine}
        textColor={palette.text}
      />
      {activeTag ? (
        <View
          style={[
            styles.activeTagChip,
            {
              backgroundColor: tagColors.surface,
              borderColor: tagColors.accent,
              paddingRight: tagCanClear ? 5 : 9,
            },
          ]}
        >
          {tagTone === 'favorites' ? (
            <NativeCollectionPriorityStar
              label="Favorites tag"
              size={16}
              style={styles.tagStar}
              tone="favorite"
            />
          ) : (
            <View
              accessibilityElementsHidden
              style={[styles.tagDot, { backgroundColor: tagColors.accent }]}
            />
          )}
          <Text style={[styles.activeTagText, { color: palette.tagText }]}>
            {activeTag}
          </Text>
          {tagCanClear ? (
            <Pressable
              accessibilityLabel={`Clear ${activeTag} tag filter`}
              accessibilityRole="button"
              onPress={onClearTag}
              style={[styles.clearTag, { backgroundColor: tagColors.accent }]}
            >
              <Text style={[styles.clearTagText, { color: tagColors.contrast }]}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {error ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={[styles.errorTitle, { color: palette.text }]}>Collection unavailable</Text>
          <Text style={[styles.errorBody, { color: palette.secondaryText }]}>{error}</Text>
          {onRetry ? (
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {includeSearchMenu ? (
        <NativeCollectionSearchMenu
          assetBaseUrl={assetBaseUrl}
          onFilterPress={appendFilter}
          textColor={palette.text}
        />
      ) : null}
    </View>
  ), [
    activeTag,
    appendFilter,
    assetBaseUrl,
    changeQuery,
    error,
    onClearTag,
    onRetry,
    palette.search,
    palette.searchText,
    palette.background,
    palette.secondaryText,
    palette.tagText,
    palette.text,
    query,
    searchMenuVisible,
    showEvolutionaryLine,
    tagCanClear,
    tagColors.accent,
    tagColors.contrast,
    tagColors.surface,
    tagTone,
    toggleEvolutionaryLine,
  ]);
  const emptyState = useMemo(() => (
    <View style={styles.emptyState}>
      {isLoading ? (
        <>
          <ActivityIndicator color="#34807d" size="large" />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Loading your collection…</Text>
        </>
      ) : !error ? (
        <>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No Pokémon found</Text>
          <Text style={[styles.emptyBody, { color: palette.secondaryText }]}>Try another search or tag.</Text>
        </>
      ) : null}
    </View>
  ), [error, isLoading, palette.secondaryText, palette.text]);
  const renderCard = useCallback(({
    item,
  }: ListRenderItemInfo<CollectionCardSource>) => {
    const fixture = isParityCardFixture(item);
    const card = fixture
      ? item
      : projectNativeCollectionParityCard(item, resolvedShowOwnership);
    return (
      <CollectionParityCard
        assetBaseUrl={assetBaseUrl}
        card={card}
        cardWidth={cardWidth}
        collectionRow={fixture ? undefined : item}
        onPressCard={onCardPress}
        onLongPressCard={onCardLongPress}
        onPressCollectionRow={onCollectionRowPress}
        onLongPressCollectionRow={onCollectionRowLongPress}
        selected={selectedIds.has(card.id)}
        theme={theme}
      />
    );
  }, [
    assetBaseUrl,
    cardWidth,
    onCardLongPress,
    onCardPress,
    onCollectionRowLongPress,
    onCollectionRowPress,
    resolvedShowOwnership,
    selectedIds,
    theme,
  ]);

  return (
    <View
      style={[styles.screen, { backgroundColor: palette.background }]}
      testID="native-collection-parity-fixture"
    >
      {showHeader ? (
        <NativePokemonHubHeader
          activeTag={activeTag}
          activeTagParent={tagTone === 'wanted' || tagTone === 'most-wanted' ? 'wanted' : 'caught'}
          activeView={activeView}
          backgroundColor={palette.background}
          collectionCount={collectionCount}
          inactiveTextColor={palette.headerInactive}
          onViewChange={(view) => {
            if (view === 'inventory') onTagsPress?.();
            else if (view === 'wishlist') onWishlistPress?.();
            else onPokemonPress?.();
          }}
          secondaryTextColor={palette.secondaryText}
          selectionBackgroundColor={theme === 'light' ? '#e3f7dc' : '#34807d'}
          selectionCount={selectedIds.size}
          onClearSelection={onClearSelection}
          onSelectAll={onSelectAll}
          textColor={palette.text}
        />
      ) : null}

      {searchMenuVisible ? (
        <ScrollView
          contentContainerStyle={styles.searchMenuContent}
          keyboardShouldPersistTaps="always"
          testID="native-collection-filter-scroll"
        >
          {renderCollectionControls(true)}
        </ScrollView>
      ) : (
        <>
          {renderCollectionControls(false)}
          <FlatList
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.listContent}
            data={collectionItems}
            extraData={selectedIds}
            nestedScrollEnabled
            ref={listRef}
            initialNumToRender={COLLECTION_INITIAL_ROW_BUDGET}
            key={columns}
            keyExtractor={collectionCardKeyExtractor}
            keyboardShouldPersistTaps="always"
            maxToRenderPerBatch={COLLECTION_ROW_BATCH_BUDGET}
            numColumns={columns}
            onContentSizeChange={restoreInitialScroll}
            // The native list owns every movement frame. Persist only settled
            // offsets so ordinary vertical scrolling never schedules recurring
            // JS/cache work while the user is trying to keep 60 fps.
            onMomentumScrollEnd={persistSettledScrollOffset}
            onScrollEndDrag={persistSettledScrollOffset}
            removeClippedSubviews={false}
            {...NATIVE_FLAT_LIST_RENDERER_OPTIMIZATION}
            style={styles.gridList}
            testID="native-collection-grid"
            updateCellsBatchingPeriod={16}
            windowSize={3}
            ListEmptyComponent={emptyState}
            renderItem={renderCard}
          />
        </>
      )}

      {selectedIds.size === 0 ? <Pressable
        accessibilityLabel={sortLabel}
        accessibilityRole="button"
        onPress={onSortPress}
        style={styles.sortAnchor}
      >
        <View style={[styles.sortCircle, styles.sortTypeCircle]}>
          <View style={styles.sortInnerRing} />
          <Image fadeDuration={0}
            resizeMode="contain"
            source={toNativeCollectionImageSource(assetBaseUrl, sortIconPath)}
            style={styles.sortTypeImage}
          />
        </View>
        <View style={[styles.sortCircle, styles.sortModeCircle]}>
          <View style={styles.sortModeInnerRing} />
          <Image fadeDuration={0}
            resizeMode="contain"
            source={toNativeCollectionImageSource(assetBaseUrl, '/images/sorting/arrow.png')}
            style={[
              styles.sortArrowImage,
              sortDirection === 'descending' ? styles.sortArrowDescending : null,
            ]}
          />
        </View>
      </Pressable> : null}

      {selectedIds.size === 0 && onActionMenuPress ? (
        <NativeActionMenuAnchor
          assetBaseUrl={assetBaseUrl}
          onPress={onActionMenuPress}
        />
      ) : null}

      {selectedIds.size > 0 && onSelectionActionPress ? (
        <View pointerEvents="box-none" style={styles.selectionActionContainer}>
          <Pressable
            accessibilityLabel={`${selectionAction === 'add' ? 'Add' : 'Organize'} (${selectedIds.size})`}
            accessibilityRole="button"
            onPress={onSelectionActionPress}
            style={styles.selectionActionButton}
          >
            <Text style={styles.selectionActionText}>
              {selectionAction === 'add' ? '+' : '◆'} {selectionAction === 'add' ? 'Add' : 'Organize'} ({selectedIds.size})
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}));

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 2,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabText: { fontSize: 11, fontWeight: '800' },
  tabSubtext: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  activeUnderline: {
    position: 'absolute',
    bottom: -10,
    width: 100,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: 92,
  },
  searchMenuContent: {
    flexGrow: 1,
    paddingBottom: 92,
  },
  gridList: { flex: 1, minHeight: 0 },
  gridRow: { gap: GRID_GAP },
  collectionControls: {
    alignItems: 'center',
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingBottom: 6,
  },
  activeTagChip: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ffd45a',
    borderRadius: 999,
    paddingLeft: 9,
    paddingRight: 5,
    paddingVertical: 3,
  },
  tagStar: { marginRight: 3 },
  tagDot: {
    width: 9,
    height: 9,
    marginRight: 2,
    borderRadius: 5,
    shadowColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  activeTagText: { fontSize: 14.5, fontWeight: '900' },
  clearTag: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 13,
    backgroundColor: '#ffd45a',
  },
  clearTagText: { color: '#111', fontSize: 18, fontWeight: '900', lineHeight: 19 },
  errorCard: {
    width: '92%',
    gap: 7,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ef5b72',
    borderRadius: 10,
    padding: 12,
    backgroundColor: 'rgba(239, 91, 114, 0.12)',
  },
  errorTitle: { fontSize: 15, fontWeight: '900', textAlign: 'center' },
  errorBody: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
  retryButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ef5b72',
  },
  retryButtonText: { color: '#fff', fontWeight: '800' },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  card: {
    position: 'relative',
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
  },
  selectedCard: { borderRadius: 8, backgroundColor: '#34807d' },
  cardTopLine: { width: '100%', height: 20, alignItems: 'center', justifyContent: 'center' },
  cpDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  cpLabel: { fontSize: 10, lineHeight: 12 },
  cpValue: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  hidden: { opacity: 0 },
  priorityStar: { position: 'absolute', top: -2, right: 4 },
  imageStage: {
    width: '65%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStageWide: { width: '100%', marginTop: 5, marginBottom: 13 },
  luckyBackground: { position: 'absolute', width: '100%', height: '100%', opacity: 0.85 },
  pokemonImage: { width: '100%', height: '100%' },
  maxBadge: {
    position: 'absolute',
    top: '10%',
    right: '8%',
    width: '30%',
    height: '30%',
  },
  purifiedBadge: {
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '20%',
    height: '20%',
  },
  dexNumber: { minHeight: 11, fontSize: 8.5, lineHeight: 10 },
  typeIcons: { minHeight: 9, flexDirection: 'row', justifyContent: 'center', gap: 3 },
  typeIcon: { width: 7, height: 7 },
  name: {
    minHeight: 28,
    maxWidth: '100%',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },
  sortAnchor: {
    position: 'absolute',
    right: 7,
    bottom: 14,
    zIndex: 20,
    height: 63,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#34807d',
    shadowColor: '#fff',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
  sortTypeCircle: { width: 62, height: 62 },
  sortModeCircle: { width: 31, height: 31, marginLeft: -16 },
  sortInnerRing: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderWidth: 1.5,
    borderColor: '#b4fea7',
    borderRadius: 999,
  },
  sortModeInnerRing: {
    position: 'absolute',
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderWidth: 1,
    borderColor: '#b4fea7',
    borderRadius: 999,
  },
  sortTypeImage: { width: 30, height: 30 },
  sortArrowImage: { width: 15, height: 15 },
  sortArrowDescending: { transform: [{ rotate: '180deg' }] },
  selectionActionContainer: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    left: 0,
    zIndex: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectionActionButton: {
    width: '100%',
    maxWidth: 520,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7cbcff',
    borderRadius: 14,
    backgroundColor: '#007bff',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  selectionActionText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

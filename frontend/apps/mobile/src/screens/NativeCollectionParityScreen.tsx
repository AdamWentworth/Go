import {
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  CollectionParityCardFixture,
} from '../features/collection/parity/collectionParityFixtures';
import {
  NativeCollectionParityFixture,
  type NativeCollectionParityFixtureHandle,
} from '../features/collection/parity/NativeCollectionParityFixture';
import {
  filterNativeCollectionRows,
  sortNativeCollectionRows,
  type NativeCollectionRow,
  type NativeCollectionSort,
  type NativeCollectionSortDirection,
  type NativeTagSummary,
} from '../features/collection/collectionModel';
import type { NativePokemonHubView } from '../features/collection/NativePokemonHubHeader';
import {
  NATIVE_SORT_OPTIONS,
  NativeCollectionSortMenu,
} from '../features/collection/parity/NativeCollectionSortMenu';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import type { NativeCollectionSession } from '../features/collection/nativeCollectionSessionCache';

type NativeCollectionParityScreenProps = {
  assetBaseUrl: string;
  rows: NativeCollectionRow[];
  searchUniverseRows?: NativeCollectionRow[];
  activeTag: NativeTagSummary | null;
  query: string;
  initialScrollOffset?: number;
  initialShowEvolutionaryLine?: boolean;
  initialSort?: NativeCollectionSort;
  initialSortDirection?: NativeCollectionSortDirection;
  isLoading: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onOpenInstance: (instanceId: string, orderedInstanceIds: string[]) => void;
  onLongPressInstance?: (instanceId: string) => void;
  onOpenCanonicalCollection?: () => void;
  onClearTag: () => void;
  onViewChange: (view: NativePokemonHubView) => void;
  showHeader?: boolean;
  selectedIds?: ReadonlySet<string>;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onSelectionActionPress?: () => void;
  selectionAction?: 'add' | 'organize';
  tagCanClear?: boolean;
  onContextChange?: (patch: Partial<NativeCollectionSession>) => void;
};

const SORT_ICONS: Record<NativeCollectionSort, string> = {
  releaseDate: '/images/sorting/recent.png',
  favorite: '/images/sorting/favorite.png',
  number: '/images/sorting/number.png',
  hp: '/images/sorting/hp.png',
  name: '/images/sorting/name.png',
  combatPower: '/images/sorting/cp.png',
};

const toParityCard = (
  row: NativeCollectionRow,
  showOwnership: boolean,
): CollectionParityCardFixture => ({
  id: row.id,
  cp: row.cp,
  dexNumber: row.pokedexNumber,
  name: row.name,
  imagePath: row.imageUri ?? `/images/disabled/disabled_${row.pokemonId}.png`,
  interaction: row.source === 'catalog' ? 'select' : 'view',
  typeIconPaths: row.typeIconUris,
  favorite: row.favorite,
  mostWanted: row.mostWanted,
  lucky: row.lucky,
  locationBackgroundPath: row.locationBackgroundUri ?? undefined,
  maxKind: row.maxKind ?? undefined,
  ownership: showOwnership && row.source !== 'catalog' ? row.status : undefined,
  purified: row.purified,
});

const ownedCardCache = new WeakMap<
  NativeCollectionRow,
  CollectionParityCardFixture
>();
const catalogCardCache = new WeakMap<
  NativeCollectionRow,
  CollectionParityCardFixture
>();
const ownedCardListCache = new WeakMap<
  NativeCollectionRow[],
  CollectionParityCardFixture[]
>();
const catalogCardListCache = new WeakMap<
  NativeCollectionRow[],
  CollectionParityCardFixture[]
>();
const rowIdProjectionCache = new WeakMap<NativeCollectionRow[], string[]>();

export const projectNativeCollectionParityCards = (
  rows: NativeCollectionRow[],
  showOwnership: boolean,
): CollectionParityCardFixture[] => {
  const listCache = showOwnership ? ownedCardListCache : catalogCardListCache;
  const cachedList = listCache.get(rows);
  if (cachedList) return cachedList;
  const cardCache = showOwnership ? ownedCardCache : catalogCardCache;
  const cards = rows.map((row) => {
    const cachedCard = cardCache.get(row);
    if (cachedCard) return cachedCard;
    const card = toParityCard(row, showOwnership);
    cardCache.set(row, card);
    return card;
  });
  listCache.set(rows, cards);
  return cards;
};

const toVisibleRowIds = (rows: NativeCollectionRow[]): string[] => {
  const cached = rowIdProjectionCache.get(rows);
  if (cached) return cached;
  const ids = rows.map((row) => row.id);
  rowIdProjectionCache.set(rows, ids);
  return ids;
};

export const prepareNativeCollectionParityRows = (
  rows: NativeCollectionRow[],
): void => {
  const sortedRows = sortNativeCollectionRows(rows, 'number', 'ascending');
  projectNativeCollectionParityCards(sortedRows, true);
};

const EMPTY_SELECTED_IDS: ReadonlySet<string> = new Set<string>();

const catalogOnlyRowsCache = new WeakMap<NativeCollectionRow[], boolean>();
const containsOnlyCatalogRows = (rows: NativeCollectionRow[]): boolean => {
  const cached = catalogOnlyRowsCache.get(rows);
  if (cached !== undefined) return cached;
  const result = rows.length > 0 && rows.every((row) => row.source === 'catalog');
  catalogOnlyRowsCache.set(rows, result);
  return result;
};

export type NativeCollectionParityScreenHandle = NativeCollectionParityFixtureHandle;

export const NativeCollectionParityScreen = memo(forwardRef<
  NativeCollectionParityScreenHandle,
  NativeCollectionParityScreenProps
>(function NativeCollectionParityScreen({
  assetBaseUrl,
  rows,
  searchUniverseRows = rows,
  activeTag,
  query,
  initialScrollOffset = 0,
  initialShowEvolutionaryLine = false,
  initialSort = 'number',
  initialSortDirection = 'ascending',
  isLoading,
  error,
  onQueryChange,
  onRetry,
  onOpenInstance,
  onLongPressInstance,
  onOpenCanonicalCollection,
  onClearTag,
  onViewChange,
  showHeader = true,
  selectedIds = EMPTY_SELECTED_IDS,
  onClearSelection,
  onSelectAll,
  onSelectionActionPress,
  selectionAction = 'organize',
  tagCanClear = Boolean(activeTag),
  onContextChange,
}, ref) {
  const colorScheme = useNativeColorScheme();
  const [sort, setSort] = useState<NativeCollectionSort>(initialSort);
  const [direction, setDirection] = useState<NativeCollectionSortDirection>(initialSortDirection);
  const [sortOpen, setSortOpen] = useState(false);
  const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(initialShowEvolutionaryLine);
  const deferredQuery = useDeferredValue(query);
  const deferredShowEvolutionaryLine = useDeferredValue(showEvolutionaryLine);
  // Match Vite's architecture: one virtualized grid receives a new immutable
  // projection when the tag changes. Sorting and card projection are cached,
  // so this changes the small visible window without retaining a hidden image
  // grid for every tag in the native view hierarchy.
  const filteredRows = useMemo(
    () => filterNativeCollectionRows(rows, 'all', deferredQuery, {
      showEvolutionaryLine: deferredShowEvolutionaryLine,
      universeRows: searchUniverseRows,
    }),
    [deferredQuery, deferredShowEvolutionaryLine, rows, searchUniverseRows],
  );
  const visibleRows = useMemo(
    () => sortNativeCollectionRows(filteredRows, sort, direction),
    [direction, filteredRows, sort],
  );
  const cards = useMemo(
    () => projectNativeCollectionParityCards(visibleRows, Boolean(activeTag)),
    [activeTag, visibleRows],
  );
  const visibleRowsRef = useRef(visibleRows);
  useLayoutEffect(() => {
    visibleRowsRef.current = visibleRows;
  }, [visibleRows]);
  const handleCardPress = useCallback(
    (card: CollectionParityCardFixture) => onOpenInstance(
      card.id,
      toVisibleRowIds(visibleRowsRef.current),
    ),
    [onOpenInstance],
  );
  const handleCardLongPress = useMemo(
    () => onLongPressInstance
      ? (card: CollectionParityCardFixture) => onLongPressInstance(card.id)
      : undefined,
    [onLongPressInstance],
  );
  const sortLabel = NATIVE_SORT_OPTIONS.find((option) => option.key === sort)?.label ?? 'NUMBER';
  const theme = colorScheme === 'light' ? 'light' : 'dark';
  const handleToggleEvolutionaryLine = useCallback(() => {
    setShowEvolutionaryLine((current) => {
      const next = !current;
      onContextChange?.({ showEvolutionaryLine: next, scrollOffset: 0 });
      return next;
    });
  }, [onContextChange]);
  const handleScrollOffsetChange = useCallback((scrollOffset: number) => {
    onContextChange?.({ scrollOffset });
  }, [onContextChange]);
  const openSortMenu = useCallback(() => setSortOpen(true), []);
  const closeSortMenu = useCallback(() => setSortOpen(false), []);
  const selectSort = useCallback((nextSort: NativeCollectionSort) => {
    setSortOpen(false);
    // Match Vite's immediate visible-list update.
    if (nextSort === sort) {
      setDirection((current) => {
        const nextDirection = current === 'ascending' ? 'descending' : 'ascending';
        onContextChange?.({ sortDirection: nextDirection, scrollOffset: 0 });
        return nextDirection;
      });
      return;
    }
    setSort(nextSort);
    const nextDirection = nextSort === 'favorite' ? 'descending' : 'ascending';
    setDirection(nextDirection);
    onContextChange?.({
      sort: nextSort,
      sortDirection: nextDirection,
      scrollOffset: 0,
    });
  }, [onContextChange, sort]);
  const openPokemon = useCallback(() => onViewChange('pokemon'), [onViewChange]);
  const openTags = useCallback(() => onViewChange('inventory'), [onViewChange]);
  const openWishlist = useCallback(() => onViewChange('wishlist'), [onViewChange]);
  const containsOnlyCatalog = containsOnlyCatalogRows(rows);
  const projectedSelectionAction = containsOnlyCatalog ? 'add' : selectionAction;
  const scrollResetKey = `${activeTag?.key ?? 'catalog'}:${sort}:${direction}:${showEvolutionaryLine}`;

  return (
    <View style={styles.screen} testID="native-collection-parity-screen">
      <NativeCollectionParityFixture
        activeTag={activeTag?.filterName ?? activeTag?.name ?? null}
        assetBaseUrl={assetBaseUrl}
        cards={cards}
        collectionCount={visibleRows.length}
        error={error}
        isLoading={isLoading}
        onActionMenuPress={onOpenCanonicalCollection}
        onCardPress={handleCardPress}
        onCardLongPress={handleCardLongPress}
        customTagColor={activeTag?.color}
        onClearTag={onClearTag}
        onQueryChange={onQueryChange}
        onToggleEvolutionaryLine={handleToggleEvolutionaryLine}
        onRetry={onRetry}
        onSortPress={openSortMenu}
        onPokemonPress={openPokemon}
        onTagsPress={openTags}
        onWishlistPress={openWishlist}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onSelectionActionPress={onSelectionActionPress}
        initialScrollOffset={initialScrollOffset}
        onScrollOffsetChange={handleScrollOffsetChange}
        query={query}
        ref={ref}
        scrollResetKey={scrollResetKey}
        sortDirection={direction}
        sortIconPath={SORT_ICONS[sort]}
        sortLabel={`Sort by ${sortLabel} ${direction}`}
        showEvolutionaryLine={showEvolutionaryLine}
        tagCanClear={Boolean(activeTag) && tagCanClear}
        tagTone={activeTag?.tone ?? 'caught'}
        theme={theme}
        showHeader={showHeader}
        selectedIds={selectedIds}
        selectionAction={projectedSelectionAction}
      />

      <NativeCollectionSortMenu
        assetBaseUrl={assetBaseUrl}
        direction={direction}
        onClose={closeSortMenu}
        onSelect={selectSort}
        open={sortOpen}
        sort={sort}
      />
    </View>
  );
}));

const styles = StyleSheet.create({
  screen: { flex: 1 },
});

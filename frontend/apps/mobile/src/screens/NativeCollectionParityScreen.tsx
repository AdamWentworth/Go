import {
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  CollectionParityCardFixture,
} from '../features/collection/parity/collectionParityFixtures';
import {
  NativeCollectionParityFixture,
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
  toVisibleRowIds(sortedRows);
};

const EMPTY_SELECTED_IDS: ReadonlySet<string> = new Set<string>();

export const NativeCollectionParityScreen = ({
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
}: NativeCollectionParityScreenProps) => {
  const colorScheme = useNativeColorScheme();
  const [sort, setSort] = useState<NativeCollectionSort>(initialSort);
  const [direction, setDirection] = useState<NativeCollectionSortDirection>(initialSortDirection);
  const [sortOpen, setSortOpen] = useState(false);
  const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(initialShowEvolutionaryLine);
  const [, startResultTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const deferredShowEvolutionaryLine = useDeferredValue(showEvolutionaryLine);
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
  const visibleRowIds = useMemo(
    () => toVisibleRowIds(visibleRows),
    [visibleRows],
  );
  const visibleRowIdsRef = useRef(visibleRowIds);
  useLayoutEffect(() => {
    visibleRowIdsRef.current = visibleRowIds;
  }, [visibleRowIds]);
  const handleCardPress = useCallback(
    (card: CollectionParityCardFixture) => onOpenInstance(card.id, visibleRowIdsRef.current),
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
  const scrollResetKey = `${activeTag?.key ?? 'catalog'}:${sort}:${direction}:${deferredShowEvolutionaryLine}`;

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
        onToggleEvolutionaryLine={() => setShowEvolutionaryLine((current) => {
          const next = !current;
          onContextChange?.({ showEvolutionaryLine: next, scrollOffset: 0 });
          return next;
        })}
        onRetry={onRetry}
        onSortPress={() => setSortOpen(true)}
        onPokemonPress={() => onViewChange('pokemon')}
        onTagsPress={() => onViewChange('inventory')}
        onWishlistPress={() => onViewChange('wishlist')}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onSelectionActionPress={onSelectionActionPress}
        initialScrollOffset={initialScrollOffset}
        onScrollOffsetChange={(scrollOffset) => onContextChange?.({ scrollOffset })}
        query={query}
        scrollResetKey={scrollResetKey}
        sortDirection={direction}
        sortIconPath={SORT_ICONS[sort]}
        sortLabel={`Sort by ${sortLabel} ${direction}`}
        showEvolutionaryLine={showEvolutionaryLine}
        tagCanClear={tagCanClear}
        tagTone={activeTag?.tone ?? 'caught'}
        theme={theme}
        showHeader={showHeader}
        selectedIds={selectedIds}
        selectionAction={selectionAction}
      />

      <NativeCollectionSortMenu
        assetBaseUrl={assetBaseUrl}
        direction={direction}
        onClose={() => setSortOpen(false)}
        onSelect={(nextSort) => {
          setSortOpen(false);
          startResultTransition(() => {
            if (nextSort === sort) {
              setDirection((current) => {
                const nextDirection = current === 'ascending' ? 'descending' : 'ascending';
                onContextChange?.({ sortDirection: nextDirection, scrollOffset: 0 });
                return nextDirection;
              });
            } else {
              setSort(nextSort);
              const nextDirection = nextSort === 'favorite' ? 'descending' : 'ascending';
              setDirection(nextDirection);
              onContextChange?.({
                sort: nextSort,
                sortDirection: nextDirection,
                scrollOffset: 0,
              });
            }
          });
        }}
        open={sortOpen}
        sort={sort}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
});

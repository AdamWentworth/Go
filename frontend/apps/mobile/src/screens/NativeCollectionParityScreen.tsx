import {
  useCallback,
  useDeferredValue,
  useMemo,
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

const ownedCardProjectionCache = new WeakMap<
  NativeCollectionRow[],
  CollectionParityCardFixture[]
>();
const catalogCardProjectionCache = new WeakMap<
  NativeCollectionRow[],
  CollectionParityCardFixture[]
>();

const toParityCards = (
  rows: NativeCollectionRow[],
  showOwnership: boolean,
): CollectionParityCardFixture[] => {
  const cache = showOwnership ? ownedCardProjectionCache : catalogCardProjectionCache;
  const cached = cache.get(rows);
  if (cached) return cached;
  const cards = rows.map((row) => toParityCard(row, showOwnership));
  cache.set(rows, cards);
  return cards;
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
    () => toParityCards(visibleRows, Boolean(activeTag)),
    [activeTag, visibleRows],
  );
  const visibleRowIds = useMemo(
    () => visibleRows.map((row) => row.id),
    [visibleRows],
  );
  const handleCardPress = useCallback(
    (card: CollectionParityCardFixture) => onOpenInstance(card.id, visibleRowIds),
    [onOpenInstance, visibleRowIds],
  );
  const handleCardLongPress = useMemo(
    () => onLongPressInstance
      ? (card: CollectionParityCardFixture) => onLongPressInstance(card.id)
      : undefined,
    [onLongPressInstance],
  );
  const sortLabel = NATIVE_SORT_OPTIONS.find((option) => option.key === sort)?.label ?? 'NUMBER';
  const theme = colorScheme === 'light' ? 'light' : 'dark';

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
        scrollResetKey={`${activeTag?.key ?? 'catalog'}:${deferredQuery}:${sort}:${direction}:${deferredShowEvolutionaryLine}`}
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

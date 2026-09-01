import {
  forwardRef,
  useCallback,
  useDeferredValue,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
  warmCatalogRows?: NativeCollectionRow[];
  warmTags?: NativeTagSummary[];
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

export type NativeCollectionParityScreenHandle = {
  revealSurface: (surfaceKey: string) => boolean;
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
const EMPTY_ROW_IDS: string[] = [];
const CATALOG_SURFACE_KEY = 'catalog';

type NativeCollectionSurfaceProjection = {
  cards: CollectionParityCardFixture[];
  key: string;
  rowIds: string[];
  rows: NativeCollectionRow[];
  tag: NativeTagSummary | null;
};

export const NativeCollectionParityScreen = forwardRef<
  NativeCollectionParityScreenHandle,
  NativeCollectionParityScreenProps
>(function NativeCollectionParityScreen({
  assetBaseUrl,
  rows,
  searchUniverseRows = rows,
  warmCatalogRows,
  warmTags = [],
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
  const [, startResultTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const deferredShowEvolutionaryLine = useDeferredValue(showEvolutionaryLine);
  const activeSurfaceKey = activeTag?.key ?? CATALOG_SURFACE_KEY;
  const [initialSurfaceKey] = useState(activeSurfaceKey);
  const warmSurfaceContexts = useMemo(() => {
    const contexts: { key: string; rows: NativeCollectionRow[]; tag: NativeTagSummary | null }[] = [];
    const seen = new Set<string>();
    const append = (
      key: string,
      contextRows: NativeCollectionRow[],
      tag: NativeTagSummary | null,
    ) => {
      if (seen.has(key)) return;
      seen.add(key);
      contexts.push({ key, rows: contextRows, tag });
    };
    if (warmCatalogRows) append(CATALOG_SURFACE_KEY, warmCatalogRows, null);
    warmTags.forEach((tag) => append(tag.key, tag.rows, tag));
    return contexts;
  }, [warmCatalogRows, warmTags]);
  const surfaceContexts = useMemo(() => {
    if (warmSurfaceContexts.some((context) => context.key === activeSurfaceKey)) {
      return warmSurfaceContexts;
    }
    return [
      ...warmSurfaceContexts,
      {
        key: activeSurfaceKey,
        rows,
        tag: activeTag,
      },
    ];
  }, [activeSurfaceKey, activeTag, rows, warmSurfaceContexts]);
  // Vite keeps the three page panels mounted and only changes the Pokémon
  // projection selected by the tag. Keep every warmed native projection
  // independent of the active key too: switching tags should only flip two
  // surface wrappers, not rebuild/sort every hidden FlatList before motion can
  // begin.
  const baseSurfaceProjections = useMemo<NativeCollectionSurfaceProjection[]>(() => (
    surfaceContexts.map((context) => {
      const visibleRows = sortNativeCollectionRows(context.rows, sort, direction);
      return {
        cards: projectNativeCollectionParityCards(visibleRows, Boolean(context.tag)),
        key: context.key,
        rowIds: toVisibleRowIds(visibleRows),
        rows: visibleRows,
        tag: context.tag,
      };
    })
  ), [direction, sort, surfaceContexts]);
  const activeQueryProjection = useMemo<NativeCollectionSurfaceProjection | null>(() => {
    if (!deferredQuery.trim()) return null;
    const context = surfaceContexts.find((candidate) => candidate.key === activeSurfaceKey);
    if (!context) return null;
    const filteredRows = filterNativeCollectionRows(context.rows, 'all', deferredQuery, {
      showEvolutionaryLine: deferredShowEvolutionaryLine,
      universeRows: searchUniverseRows,
    });
    const visibleRows = sortNativeCollectionRows(filteredRows, sort, direction);
    return {
      cards: projectNativeCollectionParityCards(visibleRows, Boolean(context.tag)),
      key: context.key,
      rowIds: toVisibleRowIds(visibleRows),
      rows: visibleRows,
      tag: context.tag,
    };
  }, [
    activeSurfaceKey,
    deferredQuery,
    deferredShowEvolutionaryLine,
    direction,
    searchUniverseRows,
    sort,
    surfaceContexts,
  ]);
  const surfaceProjections = useMemo(() => {
    if (!activeQueryProjection) return baseSurfaceProjections;
    return baseSurfaceProjections.map((projection) => (
      projection.key === activeQueryProjection.key ? activeQueryProjection : projection
    ));
  }, [activeQueryProjection, baseSurfaceProjections]);
  const activeProjection = surfaceProjections.find(
    (projection) => projection.key === activeSurfaceKey,
  ) ?? surfaceProjections[0];
  const renderedProjections = useMemo(() => (
    Platform.OS === 'web'
      ? activeProjection ? [activeProjection] : []
      : surfaceProjections
  ), [activeProjection, surfaceProjections]);
  const surfaceNodesRef = useRef(new Map<string, View>());
  const fixtureNodesRef = useRef(new Map<string, NativeCollectionParityFixtureHandle>());
  const revealedSurfaceKeyRef = useRef(activeSurfaceKey);
  const surfaceRefCallbacks = useMemo(() => new Map(renderedProjections.map((projection) => [
    projection.key,
    (node: View | null) => {
      if (node) surfaceNodesRef.current.set(projection.key, node);
      else surfaceNodesRef.current.delete(projection.key);
    },
  ])), [renderedProjections]);
  const fixtureRefCallbacks = useMemo(() => new Map(renderedProjections.map((projection) => [
    projection.key,
    (node: NativeCollectionParityFixtureHandle | null) => {
      if (node) fixtureNodesRef.current.set(projection.key, node);
      else fixtureNodesRef.current.delete(projection.key);
    },
  ])), [renderedProjections]);
  const revealSurface = useCallback((surfaceKey: string): boolean => {
    if (Platform.OS === 'web') return false;
    const nextNode = surfaceNodesRef.current.get(surfaceKey);
    if (!nextNode) return false;
    // Vite resets the Pokémon grid to the top whenever a side tag sends the
    // user back to the middle page. Reset the already-mounted destination list
    // imperatively while it is still offscreen, avoiding an active/inactive
    // prop that would wake two large FlatLists during every tag swap.
    fixtureNodesRef.current.get(surfaceKey)?.resetScroll();
    const previousKey = revealedSurfaceKeyRef.current;
    if (previousKey !== surfaceKey) {
      surfaceNodesRef.current.get(previousKey)?.setNativeProps({
        pointerEvents: 'none',
        style: styles.inactiveSurface,
      });
      nextNode.setNativeProps({
        pointerEvents: 'auto',
        style: styles.activeSurface,
      });
      revealedSurfaceKeyRef.current = surfaceKey;
    }
    return true;
  }, []);
  useImperativeHandle(ref, () => ({ revealSurface }), [revealSurface]);
  useLayoutEffect(() => {
    revealedSurfaceKeyRef.current = activeSurfaceKey;
  }, [activeSurfaceKey]);
  const visibleRowIds = activeProjection?.rowIds ?? EMPTY_ROW_IDS;
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
  const openPokemon = useCallback(() => onViewChange('pokemon'), [onViewChange]);
  const openTags = useCallback(() => onViewChange('inventory'), [onViewChange]);
  const openWishlist = useCallback(() => onViewChange('wishlist'), [onViewChange]);

  return (
    <View style={styles.screen} testID="native-collection-parity-screen">
      {renderedProjections.map((projection) => {
        const isActive = projection.key === activeSurfaceKey;
        const projectedSelectionAction = projection.rows.length > 0
          && projection.rows.every((row) => row.source === 'catalog')
          ? 'add'
          : selectionAction;
        return (
          <View
            accessibilityElementsHidden={!isActive}
            aria-hidden={!isActive}
            importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
            key={projection.key}
            pointerEvents={isActive ? 'auto' : 'none'}
            ref={surfaceRefCallbacks.get(projection.key)}
            style={[styles.surface, !isActive && styles.inactiveSurface]}
            testID={`native-collection-surface-${projection.key}`}
          >
            <NativeCollectionParityFixture
              activeTag={projection.tag?.filterName ?? projection.tag?.name ?? null}
              assetBaseUrl={assetBaseUrl}
              cards={projection.cards}
              collectionCount={projection.rows.length}
              error={error}
              isLoading={isLoading}
              onActionMenuPress={onOpenCanonicalCollection}
              onCardPress={handleCardPress}
              onCardLongPress={handleCardLongPress}
              customTagColor={projection.tag?.color}
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
              initialScrollOffset={projection.key === initialSurfaceKey
                ? initialScrollOffset
                : 0}
              onScrollOffsetChange={handleScrollOffsetChange}
              query={isActive ? query : ''}
              ref={fixtureRefCallbacks.get(projection.key)}
              scrollResetKey={`${projection.key}:${sort}:${direction}:${deferredShowEvolutionaryLine}`}
              sortDirection={direction}
              sortIconPath={SORT_ICONS[sort]}
              sortLabel={`Sort by ${sortLabel} ${direction}`}
              showEvolutionaryLine={showEvolutionaryLine}
              tagCanClear={Boolean(projection.tag) && tagCanClear}
              tagTone={projection.tag?.tone ?? 'caught'}
              theme={theme}
              showHeader={showHeader}
              selectedIds={isActive && selectedIds.size > 0 ? selectedIds : EMPTY_SELECTED_IDS}
              selectionAction={projectedSelectionAction}
            />
          </View>
        );
      })}

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
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  surface: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  activeSurface: { opacity: 1 },
  inactiveSurface: { opacity: 0 },
});

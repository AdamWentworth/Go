import {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  resetSurface: (surfaceKey: string) => boolean;
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
const EMPTY_ROWS: NativeCollectionRow[] = [];
const CATALOG_SURFACE_KEY = 'catalog';
const SURFACE_WARM_START_DELAY_MS = 180;
const SURFACE_WARM_INTERVAL_MS = 48;

type NativeCollectionSurfaceProjection = {
  cards: CollectionParityCardFixture[];
  containsOnlyCatalogRows: boolean;
  key: string;
  rows: NativeCollectionRow[];
  tag: NativeTagSummary | null;
};

const catalogOnlyRowsCache = new WeakMap<NativeCollectionRow[], boolean>();
const containsOnlyCatalogRows = (rows: NativeCollectionRow[]): boolean => {
  const cached = catalogOnlyRowsCache.get(rows);
  if (cached !== undefined) return cached;
  const result = rows.length > 0 && rows.every((row) => row.source === 'catalog');
  catalogOnlyRowsCache.set(rows, result);
  return result;
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
  const deferredQuery = useDeferredValue(query);
  const deferredSort = useDeferredValue(sort);
  const deferredDirection = useDeferredValue(direction);
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
  const allSurfaceContexts = useMemo(() => {
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
  const [preparedSurfaceKeys, setPreparedSurfaceKeys] = useState<ReadonlySet<string>>(
    () => new Set([activeSurfaceKey]),
  );
  useEffect(() => {
    setPreparedSurfaceKeys((current) => {
      if (current.has(activeSurfaceKey)) return current;
      const next = new Set(current);
      next.add(activeSurfaceKey);
      return next;
    });
  }, [activeSurfaceKey]);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const pendingKeys = allSurfaceContexts
      .map((context) => context.key)
      .filter((key) => key !== activeSurfaceKey);
    let index = 0;
    const warmNextSurface = () => {
      if (cancelled) return;
      const surfaceKey = pendingKeys[index];
      if (!surfaceKey) return;
      setPreparedSurfaceKeys((current) => {
        if (current.has(surfaceKey)) return current;
        const next = new Set(current);
        next.add(surfaceKey);
        return next;
      });
      index += 1;
      timer = setTimeout(warmNextSurface, SURFACE_WARM_INTERVAL_MS);
    };
    // Mounting six independent image grids in the first collection commit was
    // making route entry do all future tag work up front. Paint the active
    // grid first, then prepare one offscreen destination per short idle slice.
    timer = setTimeout(warmNextSurface, SURFACE_WARM_START_DELAY_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeSurfaceKey, allSurfaceContexts]);
  const surfaceContexts = useMemo(() => allSurfaceContexts.filter(
    (context) => context.key === activeSurfaceKey || preparedSurfaceKeys.has(context.key),
  ), [activeSurfaceKey, allSurfaceContexts, preparedSurfaceKeys]);
  // Vite keeps the three page panels mounted and only changes the Pokémon
  // projection selected by the tag. Keep every warmed native projection
  // independent of the active key too: switching tags should only flip two
  // surface wrappers, not rebuild/sort every hidden FlatList before motion can
  // begin.
  const baseSurfaceProjections = useMemo<NativeCollectionSurfaceProjection[]>(() => (
    surfaceContexts.map((context) => {
      const visibleRows = sortNativeCollectionRows(
        context.rows,
        deferredSort,
        deferredDirection,
      );
      return {
        cards: projectNativeCollectionParityCards(visibleRows, Boolean(context.tag)),
        containsOnlyCatalogRows: containsOnlyCatalogRows(context.rows),
        key: context.key,
        rows: visibleRows,
        tag: context.tag,
      };
    })
  ), [deferredDirection, deferredSort, surfaceContexts]);
  const activeSurfaceProjection = useMemo<NativeCollectionSurfaceProjection | null>(() => {
    const context = surfaceContexts.find((candidate) => candidate.key === activeSurfaceKey);
    if (!context) return null;
    const filteredRows = deferredQuery.trim()
      ? filterNativeCollectionRows(context.rows, 'all', deferredQuery, {
          showEvolutionaryLine: deferredShowEvolutionaryLine,
          universeRows: searchUniverseRows,
        })
      : context.rows;
    const visibleRows = sortNativeCollectionRows(filteredRows, sort, direction);
    return {
      cards: projectNativeCollectionParityCards(visibleRows, Boolean(context.tag)),
      containsOnlyCatalogRows: containsOnlyCatalogRows(context.rows),
      key: context.key,
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
    if (!activeSurfaceProjection) return baseSurfaceProjections;
    return baseSurfaceProjections.map((projection) => (
      projection.key === activeSurfaceProjection.key ? activeSurfaceProjection : projection
    ));
  }, [activeSurfaceProjection, baseSurfaceProjections]);
  const activeProjection = activeSurfaceProjection ?? surfaceProjections[0];
  const renderedProjections = useMemo(() => (
    Platform.OS === 'web'
      ? activeProjection ? [activeProjection] : []
      : surfaceProjections
  ), [activeProjection, surfaceProjections]);
  const surfaceNodesRef = useRef(new Map<string, View>());
  const fixtureNodesRef = useRef(new Map<string, NativeCollectionParityFixtureHandle>());
  const revealedSurfaceKeyRef = useRef(activeSurfaceKey);
  const surfaceRefCallbacksRef = useRef(new Map<
    string,
    (node: View | null) => void
  >());
  const fixtureRefCallbacksRef = useRef(new Map<
    string,
    (node: NativeCollectionParityFixtureHandle | null) => void
  >());
  const getSurfaceRef = useCallback((surfaceKey: string) => {
    const cached = surfaceRefCallbacksRef.current.get(surfaceKey);
    if (cached) return cached;
    const callback = (node: View | null) => {
      if (node) surfaceNodesRef.current.set(surfaceKey, node);
      else surfaceNodesRef.current.delete(surfaceKey);
    };
    surfaceRefCallbacksRef.current.set(surfaceKey, callback);
    return callback;
  }, []);
  const getFixtureRef = useCallback((surfaceKey: string) => {
    const cached = fixtureRefCallbacksRef.current.get(surfaceKey);
    if (cached) return cached;
    const callback = (node: NativeCollectionParityFixtureHandle | null) => {
      if (node) fixtureNodesRef.current.set(surfaceKey, node);
      else fixtureNodesRef.current.delete(surfaceKey);
    };
    fixtureRefCallbacksRef.current.set(surfaceKey, callback);
    return callback;
  }, []);
  const resetSurface = useCallback((surfaceKey: string): boolean => {
    const fixture = fixtureNodesRef.current.get(surfaceKey);
    if (!fixture) return false;
    fixture.resetScroll();
    return true;
  }, []);
  const revealSurface = useCallback((surfaceKey: string): boolean => {
    if (Platform.OS === 'web') return false;
    const nextNode = surfaceNodesRef.current.get(surfaceKey);
    if (!nextNode) return false;
    // Vite resets the Pokémon grid to the top whenever a side tag sends the
    // user back to the middle page. Reset the already-mounted destination list
    // imperatively while it is still offscreen, avoiding an active/inactive
    // prop that would wake two large FlatLists during every tag swap.
    resetSurface(surfaceKey);
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
  }, [resetSurface]);
  useImperativeHandle(
    ref,
    () => ({ resetSurface, revealSurface }),
    [resetSurface, revealSurface],
  );
  useLayoutEffect(() => {
    revealedSurfaceKeyRef.current = activeSurfaceKey;
  }, [activeSurfaceKey]);
  const visibleRows = activeProjection?.rows ?? EMPTY_ROWS;
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
  const deferredSortLabel = NATIVE_SORT_OPTIONS.find(
    (option) => option.key === deferredSort,
  )?.label ?? 'NUMBER';
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
        const projectedDirection = isActive ? direction : deferredDirection;
        const projectedShowEvolutionaryLine = isActive
          ? showEvolutionaryLine
          : deferredShowEvolutionaryLine;
        const projectedSort = isActive ? sort : deferredSort;
        const projectedSortLabel = isActive ? sortLabel : deferredSortLabel;
        const projectedSelectionAction = projection.containsOnlyCatalogRows
          ? 'add'
          : selectionAction;
        return (
          <View
            accessibilityElementsHidden={!isActive}
            aria-hidden={!isActive}
            importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
            key={projection.key}
            pointerEvents={isActive ? 'auto' : 'none'}
            ref={getSurfaceRef(projection.key)}
            style={isActive
              ? styles.positionedActiveSurface
              : styles.positionedInactiveSurface}
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
              ref={getFixtureRef(projection.key)}
              scrollResetKey={`${projection.key}:${projectedSort}:${projectedDirection}:${projectedShowEvolutionaryLine}`}
              sortDirection={projectedDirection}
              sortIconPath={SORT_ICONS[projectedSort]}
              sortLabel={`Sort by ${projectedSortLabel} ${projectedDirection}`}
              showEvolutionaryLine={projectedShowEvolutionaryLine}
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
          // Match Vite's immediate visible-list update. Hidden warmed surfaces
          // consume deferred sort values, so React can paint the active grid
          // first and quietly catch the offscreen lists up afterward.
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
        }}
        open={sortOpen}
        sort={sort}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  positionedActiveSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 1,
  },
  positionedInactiveSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
  activeSurface: { opacity: 1 },
  inactiveSurface: { opacity: 0 },
});

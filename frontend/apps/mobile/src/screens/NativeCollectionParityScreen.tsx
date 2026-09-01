import {
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NativeCollectionParityFixture,
  type NativeCollectionParityFixtureHandle,
} from '../features/collection/parity/NativeCollectionParityFixture';
import {
  projectNativeCollectionParityCard,
} from '../features/collection/parity/nativeCollectionCardProjection';
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
import { markNativeUiPerformance } from '../observability/nativeUiPerformanceTrace';

export {
  projectNativeCollectionParityCards,
} from '../features/collection/parity/nativeCollectionCardProjection';

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
  onOpenInstance: (row: NativeCollectionRow, orderedRows: NativeCollectionRow[]) => void;
  onLongPressInstance?: (row: NativeCollectionRow) => void;
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
  onRowsCommitted?: (visibleRowCount: number, committedQuery: string) => void;
};

const SORT_ICONS: Record<NativeCollectionSort, string> = {
  releaseDate: '/images/sorting/recent.png',
  favorite: '/images/sorting/favorite.png',
  number: '/images/sorting/number.png',
  hp: '/images/sorting/hp.png',
  name: '/images/sorting/name.png',
  combatPower: '/images/sorting/cp.png',
};

export const prepareNativeCollectionParityRows = (
  rows: NativeCollectionRow[],
): void => {
  const sortedRows = sortNativeCollectionRows(rows, 'number', 'ascending');
  // Vite virtualizes before rendering cards. Warm only the first six native
  // phone rows (18 cards), not every item in a potentially 3,000-entry tag.
  sortedRows.slice(0, 18).forEach((row) => {
    projectNativeCollectionParityCard(row, true);
  });
};

const EMPTY_SELECTED_IDS: ReadonlySet<string> = new Set<string>();
// React Native's legacy Android Image view decodes on the render thread. Vite's
// browser pipeline lets cached lazy images complete independently, so never
// hand Android an entire mounted FlatList window in one frame. One card per
// frame keeps each decode slice small; three viewports cover FlatList's window
// before the ordinary unrestricted renderer resumes.
const COLLECTION_IMAGE_REVEAL_BATCH = 1;
const COLLECTION_INITIAL_VIEWPORT_IMAGE_COUNT = 18;
const COLLECTION_IMAGE_REVEAL_WINDOW = 54;

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
  onRowsCommitted,
}, ref) {
  const colorScheme = useNativeColorScheme();
  const [sort, setSort] = useState<NativeCollectionSort>(initialSort);
  const [direction, setDirection] = useState<NativeCollectionSortDirection>(initialSortDirection);
  const [sortOpen, setSortOpen] = useState(false);
  const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(initialShowEvolutionaryLine);
  const [stagedQuery, setStagedQuery] = useState<string | null>(null);
  const [collectionImageRevealCount, setCollectionImageRevealCount] = useState<number | null>(null);
  const [collectionImageRevealQuery, setCollectionImageRevealQuery] = useState<string | null>(null);
  const stagedQueryRef = useRef<string | null>(null);
  const stagedQueryCancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stagedQueryTraceRef = useRef<{
    paintedAt: number | null;
    query: string;
    startedAt: number;
  } | null>(null);
  const effectiveQuery = stagedQuery ?? query;
  const deferredShowEvolutionaryLine = useDeferredValue(showEvolutionaryLine);
  // Match Vite's architecture: one virtualized grid receives a new immutable
  // projection when the tag changes. Sorting and card projection are cached,
  // so this changes the small visible window without retaining a hidden image
  // grid for every tag in the native view hierarchy.
  const filteredRows = useMemo(
    () => filterNativeCollectionRows(rows, 'all', effectiveQuery, {
      showEvolutionaryLine: deferredShowEvolutionaryLine,
      universeRows: searchUniverseRows,
    }),
    [deferredShowEvolutionaryLine, effectiveQuery, rows, searchUniverseRows],
  );
  const visibleRows = useMemo(
    () => sortNativeCollectionRows(filteredRows, sort, direction),
    [direction, filteredRows, sort],
  );
  const visibleRowsRef = useRef(visibleRows);
  useLayoutEffect(() => {
    visibleRowsRef.current = visibleRows;
    // React has committed the destination card window at this point. The Hub
    // can now start its native-driven track in the same paint, just as Vite's
    // filter and CSS transform take effect in one commit.
    onRowsCommitted?.(visibleRows.length, effectiveQuery);
    const trace = stagedQueryTraceRef.current;
    if (stagedQuery !== null && trace?.query === effectiveQuery && trace.paintedAt === null) {
      requestAnimationFrame(() => {
        if (stagedQueryTraceRef.current !== trace || trace.paintedAt !== null) return;
        trace.paintedAt = Date.now();
        markNativeUiPerformance('collection_query_preview_painted', {
          interactionLatencyMs: trace.paintedAt - trace.startedAt,
          query: trace.query,
          rowCount: visibleRows.length,
        });
      });
    }
  }, [effectiveQuery, onRowsCommitted, stagedQuery, visibleRows]);
  useEffect(() => {
    if (collectionImageRevealQuery === null) return undefined;
    const startedAt = Date.now();
    const target = Math.min(COLLECTION_IMAGE_REVEAL_WINDOW, visibleRows.length);
    let revealed = 0;
    let frame: number | null = null;
    let cancelled = false;
    const finishReveal = () => {
      markNativeUiPerformance('collection_query_images_revealed', {
        interactionLatencyMs: Date.now() - startedAt,
        query: collectionImageRevealQuery,
        rowCount: visibleRows.length,
      });
      setCollectionImageRevealCount(null);
      setCollectionImageRevealQuery(null);
    };
    const revealNextBatch = () => {
      frame = requestAnimationFrame(() => {
        if (cancelled) return;
        revealed = Math.min(target, revealed + COLLECTION_IMAGE_REVEAL_BATCH);
        setCollectionImageRevealCount(revealed);
        if (revealed === Math.min(COLLECTION_INITIAL_VIEWPORT_IMAGE_COUNT, target)) {
          frame = requestAnimationFrame(() => {
            if (cancelled) return;
            markNativeUiPerformance('collection_query_viewport_images_revealed', {
              interactionLatencyMs: Date.now() - startedAt,
              query: collectionImageRevealQuery,
              rowCount: visibleRows.length,
            });
            if (revealed < target) revealNextBatch();
            else finishReveal();
          });
          return;
        }
        if (revealed < target) {
          revealNextBatch();
          return;
        }
        frame = requestAnimationFrame(() => {
          if (cancelled) return;
          finishReveal();
        });
      });
    };
    if (target === 0) {
      setCollectionImageRevealCount(null);
      setCollectionImageRevealQuery(null);
      return undefined;
    }
    revealNextBatch();
    return () => {
      cancelled = true;
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [collectionImageRevealQuery, visibleRows.length]);
  const handleRowPress = useCallback(
    (row: NativeCollectionRow) => onOpenInstance(row, visibleRowsRef.current),
    [onOpenInstance],
  );
  const handleRowLongPress = useMemo(
    () => onLongPressInstance
      ? (row: NativeCollectionRow) => onLongPressInstance(row)
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
  const previewQuery = useCallback((nextQuery: string) => {
    if (stagedQueryCancelTimerRef.current) {
      clearTimeout(stagedQueryCancelTimerRef.current);
      stagedQueryCancelTimerRef.current = null;
    }
    stagedQueryTraceRef.current = {
      paintedAt: null,
      query: nextQuery,
      startedAt: Date.now(),
    };
    markNativeUiPerformance('collection_query_preview_started', { query: nextQuery });
    setCollectionImageRevealCount(0);
    setCollectionImageRevealQuery(null);
    stagedQueryRef.current = nextQuery;
    setStagedQuery(nextQuery);
  }, []);
  const cancelQueryPreview = useCallback((nextQuery: string) => {
    if (stagedQueryCancelTimerRef.current) clearTimeout(stagedQueryCancelTimerRef.current);
    stagedQueryCancelTimerRef.current = setTimeout(() => {
      stagedQueryCancelTimerRef.current = null;
      if (stagedQueryRef.current !== nextQuery) return;
      stagedQueryTraceRef.current = null;
      setCollectionImageRevealCount(null);
      setCollectionImageRevealQuery(null);
      stagedQueryRef.current = null;
      setStagedQuery(null);
    }, 0);
  }, []);
  const changeQuery = useCallback((nextQuery: string) => {
    if (stagedQueryCancelTimerRef.current) {
      clearTimeout(stagedQueryCancelTimerRef.current);
      stagedQueryCancelTimerRef.current = null;
    }
    const trace = stagedQueryTraceRef.current;
    if (trace?.query === nextQuery) {
      markNativeUiPerformance('collection_query_preview_released', {
        previewLeadMs: Date.now() - trace.startedAt,
        previewPaintedBeforeRelease: trace.paintedAt !== null,
        query: trace.query,
      });
      setCollectionImageRevealCount(0);
      setCollectionImageRevealQuery(nextQuery);
    } else {
      setCollectionImageRevealCount(null);
      setCollectionImageRevealQuery(null);
    }
    stagedQueryTraceRef.current = null;
    stagedQueryRef.current = null;
    setStagedQuery(null);
    onQueryChange(nextQuery);
  }, [onQueryChange]);
  useEffect(() => () => {
    if (stagedQueryCancelTimerRef.current) clearTimeout(stagedQueryCancelTimerRef.current);
  }, []);
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
        collectionRows={visibleRows}
        collectionCount={visibleRows.length}
        collectionImageRevealCount={collectionImageRevealCount}
        error={error}
        isLoading={isLoading}
        onActionMenuPress={onOpenCanonicalCollection}
        onCollectionRowPress={handleRowPress}
        onCollectionRowLongPress={handleRowLongPress}
        customTagColor={activeTag?.color}
        onClearTag={onClearTag}
        onQueryChange={changeQuery}
        onQueryPreview={previewQuery}
        onCancelQueryPreview={cancelQueryPreview}
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
        showOwnership={Boolean(activeTag)}
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

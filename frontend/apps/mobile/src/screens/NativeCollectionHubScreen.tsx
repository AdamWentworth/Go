import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type {
  CreateCustomTagRequest,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  buildClearActiveTagMessage,
  collectionExperienceParityContract,
  collectionParityTokens,
} from '@pokemongonexus/shared-ui-tokens';
import {
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
} from '../components/NativeHorizontalPageSlider';
import type {
  NativeCollectionRow,
  NativeCollectionSort,
  NativeCollectionSortDirection,
  NativeTagSummary,
} from '../features/collection/collectionModel';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../features/collection/NativePokemonHubHeader';
import {
  NativeCollectionParityScreen,
  type NativeCollectionParityScreenHandle,
  prepareNativeCollectionParityRows,
} from './NativeCollectionParityScreen';
import { NativeTagsPanelScreen } from './NativeTagsPanelScreen';
import { NativeActionMenu } from '../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../components/NativeActionMenuAnchor';
import { NativeConfirmationDialog } from '../components/NativeConfirmationDialog';
import { NativePokemonOrganizerSheet } from '../features/collection/NativePokemonOrganizerSheet';
import type {
  NativePokemonOrganizerRequest,
} from '../features/collection/useNativePokemonOrganizerMutation';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import type { NativeCollectionSession } from '../features/collection/nativeCollectionSessionCache';
import { markNativeUiPerformance } from '../observability/nativeUiPerformanceTrace';

const VIEW_ORDER: readonly NativePokemonHubView[] = (
  collectionExperienceParityContract.viewOrder
);

const collectionRowsByIdCache = new WeakMap<
  NativeCollectionRow[],
  Map<string, NativeCollectionRow>
>();

const collectionRowsById = (
  rows: NativeCollectionRow[],
): Map<string, NativeCollectionRow> => {
  const cached = collectionRowsByIdCache.get(rows);
  if (cached) return cached;
  const byId = new Map(rows.map((row) => [row.id, row]));
  collectionRowsByIdCache.set(rows, byId);
  return byId;
};

type Props = {
  assetBaseUrl: string;
  catalogRows: NativeCollectionRow[];
  instances: Record<string, PokemonInstance>;
  inventoryTags: NativeTagSummary[];
  wishlistTags: NativeTagSummary[];
  error: string | null;
  warning?: string | null;
  isLoading: boolean;
  /** @deprecated The hub owns its native action menu. */
  onActionMenuPress?: () => void;
  onActionMenuNavigate?: (path: string) => void;
  onOpenEntry: (row: NativeCollectionRow, orderedRows: NativeCollectionRow[]) => void;
  onRetry: () => void;
  onCreateTag?: (request: CreateCustomTagRequest) => Promise<unknown>;
  onDeleteTag?: (tagId: string) => Promise<unknown>;
  onSaveTagOrder?: (parent: CustomTagParent, tagKeys: PokemonTagOrderKey[]) => Promise<unknown>;
  onUpdateTag?: (tagId: string, request: UpdateCustomTagRequest) => Promise<unknown>;
  isSavingTags?: boolean;
  onOrganizePokemon?: (request: NativePokemonOrganizerRequest) => Promise<{ message: string }>;
  isOrganizingPokemon?: boolean;
  organizerError?: string | null;
  catalogOwner?: string | null;
  onReturnToContext?: () => void;
  requireTagSelection?: boolean;
  initialTagKey?: string | null;
  initialQuery?: string;
  initialScrollOffset?: number;
  initialShowEvolutionaryLine?: boolean;
  initialSort?: NativeCollectionSort;
  initialSortDirection?: NativeCollectionSortDirection;
  initialView?: NativePokemonHubView;
  onContextChange?: (patch: Partial<NativeCollectionSession>) => void;
  syncStatus?: ReactNode;
};

export const NativeCollectionHubScreen = ({
  assetBaseUrl,
  catalogRows,
  instances,
  inventoryTags,
  wishlistTags,
  error,
  warning = null,
  isLoading,
  onActionMenuPress: _legacyActionMenuPress,
  onActionMenuNavigate,
  onOpenEntry,
  onRetry,
  onCreateTag,
  onDeleteTag,
  onSaveTagOrder,
  onUpdateTag,
  isSavingTags = false,
  onOrganizePokemon,
  isOrganizingPokemon = false,
  organizerError = null,
  catalogOwner = null,
  onReturnToContext,
  requireTagSelection = false,
  initialTagKey = null,
  initialQuery = '',
  initialScrollOffset = 0,
  initialShowEvolutionaryLine = false,
  initialSort = 'number',
  initialSortDirection = 'ascending',
  initialView = 'pokemon',
  onContextChange,
  syncStatus = null,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState(initialQuery);
  const [activeView, setActiveView] = useState<NativePokemonHubView>(initialView);
  const [selectedTagKey, setSelectedTagKey] = useState<string | null>(initialTagKey);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [clearTagConfirmationOpen, setClearTagConfirmationOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const collectionSurfaceRef = useRef<NativeCollectionParityScreenHandle>(null);
  const tagSelectionTraceRef = useRef<{ key: string; startedAt: number } | null>(null);
  const tagPageMotionFrameRef = useRef<number | null>(null);
  const queryRef = useRef(initialQuery);
  const selectedTagKeyRef = useRef<string | null>(initialTagKey);
  const [pageScrollX] = useState(() => new Animated.Value(width));
  const availableTags = useMemo(
    () => [...inventoryTags, ...wishlistTags],
    [inventoryTags, wishlistTags],
  );
  const selectedTag = useMemo(
    () => availableTags.find((tag) => tag.key === selectedTagKey)
      ?? (requireTagSelection
        ? availableTags.find((tag) => tag.key === 'system:caught') ?? availableTags[0] ?? null
        : null),
    [availableTags, requireTagSelection, selectedTagKey],
  );
  const selectedRows = useMemo(
    () => selectedTag?.rows ?? (requireTagSelection ? [] : catalogRows),
    [catalogRows, requireTagSelection, selectedTag],
  );
  const selectedRowsById = useMemo(
    () => collectionRowsById(selectedRows),
    [selectedRows],
  );
  const selectedRowsByIdRef = useRef(selectedRowsById);
  const selectedCountRef = useRef(selectedIds.size);
  useEffect(() => {
    selectedRowsByIdRef.current = selectedRowsById;
    selectedCountRef.current = selectedIds.size;
  }, [selectedIds.size, selectedRowsById]);
  const selectedOrganizerRows = useMemo(
    () => selectedIds.size === 0
      ? []
      : selectedRows.filter((row) => selectedIds.has(row.id)),
    [selectedIds, selectedRows],
  );
  const selectedRowsAreCatalog = selectedOrganizerRows.length > 0
    && selectedOrganizerRows.every((row) => row.source === 'catalog');
  const inventoryCount = inventoryTags.find(
    (tag) => tag.key === 'system:caught',
  )?.rows.length ?? 0;
  const palette = light
    ? collectionParityTokens.colors.light
    : collectionParityTokens.colors.dark;
  const background = palette.page;
  const text = palette.textPrimary;
  const secondary = palette.textSecondary;
  const activeIndex = VIEW_ORDER.indexOf(activeView);
  const tagEditingEnabled = Boolean(
    onCreateTag && onDeleteTag && onSaveTagOrder && onUpdateTag,
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tagsToPrepare = availableTags.slice(0, 24);
    let index = 0;
    const prepareNext = () => {
      if (cancelled) return;
      const tag = tagsToPrepare[index];
      if (!tag) return;
      prepareNativeCollectionParityRows(tag.rows);
      collectionRowsById(tag.rows);
      index += 1;
      timer = setTimeout(prepareNext, 16);
    };
    // Let initial navigation and the first collection paint finish before
    // warming one tag projection per turn of the event loop.
    timer = setTimeout(prepareNext, 250);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [availableTags]);

  useEffect(() => () => {
    if (tagPageMotionFrameRef.current != null) {
      cancelAnimationFrame(tagPageMotionFrameRef.current);
    }
  }, []);

  useEffect(() => {
    markNativeUiPerformance('collection_hub_filter_resolved', {
      activeView,
      requestedTagKey: initialTagKey,
      resolvedTagKey: selectedTag?.key ?? null,
      selectedRowCount: selectedRows.length,
    });
  }, [activeView, initialTagKey, selectedRows.length, selectedTag?.key]);

  useEffect(() => {
    const trace = tagSelectionTraceRef.current;
    if (!trace || trace.key !== selectedTag?.key || activeView !== 'pokemon') return undefined;
    const frame = requestAnimationFrame(() => {
      markNativeUiPerformance('collection_tag_result_painted', {
        interactionLatencyMs: Date.now() - trace.startedAt,
        rowCount: selectedRows.length,
        tagKey: trace.key,
      });
      tagSelectionTraceRef.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeView, selectedRows.length, selectedTag?.key]);

  const changeView = useCallback((view: NativePokemonHubView) => {
    // Commit the destination immediately so taps never wait for momentum to
    // settle before the selected tab becomes responsive. The underline still
    // follows pageScrollX continuously, so the visual indicator travels with
    // the native page rather than jumping ahead of it.
    setActiveView(view);
    onContextChange?.({ activeView: view });
    sliderRef.current?.setPage(VIEW_ORDER.indexOf(view));
  }, [onContextChange]);
  const settlePageIndex = useCallback((index: number) => {
    const view = VIEW_ORDER[index] ?? 'pokemon';
    setActiveView(view);
    onContextChange?.({ activeView: view });
  }, [onContextChange]);

  const changeQuery = useCallback((nextQuery: string) => {
    queryRef.current = nextQuery;
    setQuery(nextQuery);
    onContextChange?.({ query: nextQuery, scrollOffset: 0 });
  }, [onContextChange]);

  const selectTag = useCallback((tag: NativeTagSummary) => {
    const startedAt = Date.now();
    tagSelectionTraceRef.current = { key: tag.key, startedAt };
    markNativeUiPerformance('collection_tag_pressed', {
      rowCount: tag.rows.length,
      tagKey: tag.key,
    });
    // The browser swaps the Pokémon projection before its compositor starts
    // the page transform. Do the same without putting a React reconciliation
    // in front of the gesture: warmed native tag surfaces can be revealed
    // directly, then the already-correct middle panel begins moving in this
    // same press frame. The state update below makes that visual state
    // canonical without changing it halfway through the slide.
    const hasSearchQuery = queryRef.current.trim().length > 0;
    // A warmed unfiltered surface can be shown immediately. When a search is
    // active, keep that Vite search term and let React commit the tag+query
    // projection offscreen first; revealing the unfiltered warm surface would
    // produce the exact mid-slide content swap this path exists to prevent.
    if (hasSearchQuery) collectionSurfaceRef.current?.resetSurface(tag.key);
    else collectionSurfaceRef.current?.revealSurface(tag.key);
    const pokemonIndex = VIEW_ORDER.indexOf('pokemon');
    // Reserve the destination even if this uncommon surface has not completed
    // background warming yet. The state commit below can mount/update it, then
    // the following frame begins motion with the right content already in the
    // middle panel.
    sliderRef.current?.preparePage(pokemonIndex);
    if (tagPageMotionFrameRef.current != null) {
      cancelAnimationFrame(tagPageMotionFrameRef.current);
    }
    tagPageMotionFrameRef.current = requestAnimationFrame(() => {
      tagPageMotionFrameRef.current = null;
      markNativeUiPerformance('collection_tag_slide_started', {
        interactionLatencyMs: Date.now() - startedAt,
        tagKey: tag.key,
      });
      sliderRef.current?.setPage(pokemonIndex);
    });
    if (selectedCountRef.current > 0) setSelectedIds(new Set());

    if (selectedTagKeyRef.current === tag.key && !queryRef.current.trim()) {
      setActiveView('pokemon');
      onContextChange?.({ activeView: 'pokemon', scrollOffset: 0 });
      return;
    }

    // Match Vite's handleTagSelect: commit the filter and destination in one
    // update. The slider's layout effect begins the native-driven page motion
    // immediately after that commit; no list-layout readiness gate sits in
    // front of the interaction.
    selectedTagKeyRef.current = tag.key;
    setSelectedTagKey(tag.key);
    setActiveView('pokemon');
    onContextChange?.({
      activeView: 'pokemon',
      selectedTagKey: tag.key,
      scrollOffset: 0,
    });
  }, [onContextChange]);

  const toggleSelection = useCallback((entryId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);
  const openEntry = useCallback((entryId: string, orderedEntryIds: string[]) => {
    const rowById = selectedRowsByIdRef.current;
    const row = rowById.get(entryId);
    if (!row) return;
    if (selectedCountRef.current > 0 || row.source === 'catalog') {
      toggleSelection(entryId);
      return;
    }
    const orderedRows = orderedEntryIds.flatMap((id) => {
      const candidate = rowById.get(id);
      return candidate && candidate.source !== 'catalog' ? [candidate] : [];
    });
    onOpenEntry(row, orderedRows);
  }, [onOpenEntry, toggleSelection]);
  const longPressEntry = useCallback((entryId: string) => {
    const row = selectedRowsByIdRef.current.get(entryId);
    if (row) toggleSelection(entryId);
  }, [toggleSelection]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback(
    () => setSelectedIds(new Set(selectedRowsByIdRef.current.keys())),
    [],
  );

  const requestClearTag = useCallback(() => {
    if (requireTagSelection || !selectedTagKeyRef.current) return;
    setClearTagConfirmationOpen(true);
  }, [requireTagSelection]);
  const confirmClearTag = useCallback(() => {
    if (requireTagSelection) return;
    setClearTagConfirmationOpen(false);
    setSelectedIds(new Set());
    selectedTagKeyRef.current = null;
    setSelectedTagKey(null);
    onContextChange?.({ selectedTagKey: null, scrollOffset: 0 });
  }, [onContextChange, requireTagSelection]);
  const openActionMenu = useCallback(() => setActionMenuOpen(true), []);
  const openOrganizer = useCallback(() => setOrganizerOpen(true), []);
  useEffect(() => {
    if (!operationNotice) return undefined;
    const timer = setTimeout(() => setOperationNotice(null), 4200);
    return () => clearTimeout(timer);
  }, [operationNotice]);
  const inventoryPanel = useMemo(() => (
    <NativeTagsPanelScreen
      activeTagName={null}
      assetBaseUrl={assetBaseUrl}
      collectionCount={inventoryCount}
      error={error}
      warning={warning}
      isLoading={isLoading}
      onRetry={onRetry}
      onCreateTag={onCreateTag}
      onDeleteTag={onDeleteTag}
      onSaveOrder={onSaveTagOrder}
      onSelectTag={selectTag}
      onUpdateTag={onUpdateTag}
      onViewChange={changeView}
      parent="caught"
      isEditable={tagEditingEnabled}
      isSaving={isSavingTags}
      showHeader={false}
      tags={inventoryTags}
    />
  ), [
    assetBaseUrl,
    changeView,
    error,
    inventoryCount,
    inventoryTags,
    isLoading,
    onRetry,
    onCreateTag,
    onDeleteTag,
    onSaveTagOrder,
    onUpdateTag,
    isSavingTags,
    tagEditingEnabled,
    selectTag,
    warning,
  ]);
  const pokemonPanel = useMemo(() => (
      <NativeCollectionParityScreen
        activeTag={selectedTag}
        assetBaseUrl={assetBaseUrl}
        ref={collectionSurfaceRef}
      rows={selectedRows}
      searchUniverseRows={catalogRows}
      warmCatalogRows={requireTagSelection ? undefined : catalogRows}
      warmTags={availableTags}
      query={query}
      initialScrollOffset={initialScrollOffset}
      initialShowEvolutionaryLine={initialShowEvolutionaryLine}
      initialSort={initialSort}
      initialSortDirection={initialSortDirection}
      isLoading={isLoading}
      error={error}
      onQueryChange={changeQuery}
      onRetry={onRetry}
      onClearTag={requestClearTag}
      onViewChange={changeView}
      onOpenInstance={openEntry}
      onLongPressInstance={longPressEntry}
      showHeader={false}
      selectedIds={selectedIds}
      onClearSelection={clearSelection}
      onSelectAll={selectAll}
      onSelectionActionPress={openOrganizer}
      selectionAction={selectedRowsAreCatalog ? 'add' : 'organize'}
      tagCanClear={!requireTagSelection}
      onContextChange={onContextChange}
    />
  ), [
    assetBaseUrl,
    changeView,
    requestClearTag,
    error,
    isLoading,
    onRetry,
    openEntry,
    query,
    changeQuery,
    catalogRows,
    availableTags,
    selectedRows,
    selectedTag,
    selectedIds,
    selectedRowsAreCatalog,
    clearSelection,
    selectAll,
    requireTagSelection,
    longPressEntry,
    initialScrollOffset,
    initialShowEvolutionaryLine,
    initialSort,
    initialSortDirection,
    onContextChange,
    openOrganizer,
  ]);
  const wishlistPanel = useMemo(() => (
    <NativeTagsPanelScreen
      activeTagName={null}
      assetBaseUrl={assetBaseUrl}
      collectionCount={inventoryCount}
      error={error}
      isLoading={isLoading}
      onRetry={onRetry}
      onCreateTag={onCreateTag}
      onDeleteTag={onDeleteTag}
      onSaveOrder={onSaveTagOrder}
      onSelectTag={selectTag}
      onUpdateTag={onUpdateTag}
      onViewChange={changeView}
      parent="wanted"
      isEditable={tagEditingEnabled}
      isSaving={isSavingTags}
      showHeader={false}
      tags={wishlistTags}
      warning={warning}
    />
  ), [
    assetBaseUrl,
    changeView,
    error,
    inventoryCount,
    isLoading,
    onRetry,
    onCreateTag,
    onDeleteTag,
    onSaveTagOrder,
    onUpdateTag,
    isSavingTags,
    tagEditingEnabled,
    selectTag,
    warning,
    wishlistTags,
  ]);

  return (
    <View style={[styles.screen, { backgroundColor: background }]} testID="native-collection-hub">
      <NativePokemonHubHeader
        activeTag={selectedTag?.filterName ?? selectedTag?.name ?? null}
        activeTagParent={selectedTag?.parent ?? null}
        activeView={activeView}
        backgroundColor={background}
        collectionCount={selectedRows.length}
        inactiveTextColor={palette.headerInactive}
        onViewChange={changeView}
        scrollX={pageScrollX}
        selectionBackgroundColor={light ? '#e3f7dc' : '#34807d'}
        selectionCount={selectedIds.size}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        secondaryTextColor={secondary}
        textColor={text}
        catalogOwner={catalogOwner}
        onReturnToContext={onReturnToContext}
      />
      {syncStatus}
      {operationNotice ? (
        <View accessibilityLiveRegion="polite" style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{operationNotice}</Text>
        </View>
      ) : null}
      <NativeHorizontalPageSlider
        activeIndex={activeIndex}
        onIndexChange={settlePageIndex}
        ref={sliderRef}
        scrollX={pageScrollX}
      >
        {inventoryPanel}
        {pokemonPanel}
        {wishlistPanel}
      </NativeHorizontalPageSlider>
      {selectedIds.size === 0 ? (
        <NativeActionMenuAnchor
          assetBaseUrl={assetBaseUrl}
          onPress={openActionMenu}
        />
      ) : null}
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={assetBaseUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={(path) => {
            setActionMenuOpen(false);
            if (path === '/pokemon') return;
            if (onActionMenuNavigate) onActionMenuNavigate(path);
          }}
          signedIn
          visible
        />
      ) : null}
      {onOrganizePokemon && organizerOpen && selectedOrganizerRows.length > 0 ? (
        <NativePokemonOrganizerSheet
          error={organizerError}
          inventoryTags={inventoryTags}
          instances={instances}
          isSaving={isOrganizingPokemon}
          onApply={async (request) => {
            try {
              const result = await onOrganizePokemon(request);
              setOrganizerOpen(false);
              setSelectedIds(new Set());
              setOperationNotice(result.message);
            } catch {
              // The mutation error is rendered inside the still-open organizer.
            }
          }}
          onCreateTag={onCreateTag}
          onClose={() => setOrganizerOpen(false)}
          rows={selectedOrganizerRows}
          visible
          wishlistTags={wishlistTags}
        />
      ) : null}
      <NativeConfirmationDialog
        body={buildClearActiveTagMessage(
          selectedTag?.filterName ?? selectedTag?.name ?? 'selected',
        )}
        confirmLabel={collectionExperienceParityContract.clearTagConfirmation.confirmLabel}
        onCancel={() => setClearTagConfirmationOpen(false)}
        onConfirm={confirmClearTag}
        title={collectionExperienceParityContract.clearTagConfirmation.title}
        visible={clearTagConfirmationOpen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
  noticeBanner: {
    position: 'absolute',
    zIndex: 40,
    top: 74,
    right: 12,
    left: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2fc17d',
    borderRadius: 12,
    padding: 11,
    backgroundColor: '#123c2c',
  },
  noticeText: { color: '#c9ffe4', fontSize: 13, fontWeight: '900', textAlign: 'center' },
});

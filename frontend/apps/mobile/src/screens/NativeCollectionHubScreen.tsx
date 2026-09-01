import {
  type ReactNode,
  memo,
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
  NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
  type NativeHorizontalPageSliderHandle,
} from '../components/NativeHorizontalPageSlider';
import {
  prepareNativeCollectionSearchRows,
  type NativeCollectionRow,
  type NativeCollectionSort,
  type NativeCollectionSortDirection,
  type NativeTagSummary,
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
import { runAfterNativeUiInteractions } from '../interaction/nativeUiInteractionScheduler';

const VIEW_ORDER: readonly NativePokemonHubView[] = (
  collectionExperienceParityContract.viewOrder
);

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

export const NativeCollectionHubScreen = memo(function NativeCollectionHubScreen({
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
}: Props) {
  const resolvedInitialTagKey = initialTagKey ?? (requireTagSelection
    ? inventoryTags.find((tag) => tag.key === 'system:caught')?.key
      ?? inventoryTags[0]?.key
      ?? wishlistTags[0]?.key
      ?? null
    : null);
  const light = useNativeColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState(initialQuery);
  const [activeView, setActiveView] = useState<NativePokemonHubView>(initialView);
  const [selectedTagKey, setSelectedTagKey] = useState<string | null>(resolvedInitialTagKey);
  const [sidePanelTagKey, setSidePanelTagKey] = useState<string | null>(resolvedInitialTagKey);
  const [visibleCollectionCount, setVisibleCollectionCount] = useState(() => {
    const initialTag = [...inventoryTags, ...wishlistTags]
      .find((tag) => tag.key === resolvedInitialTagKey);
    return initialTag?.rows.length ?? (requireTagSelection ? 0 : catalogRows.length);
  });
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [clearTagConfirmationOpen, setClearTagConfirmationOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const collectionSurfaceRef = useRef<NativeCollectionParityScreenHandle>(null);
  const tagSelectionTraceRef = useRef<{ key: string; startedAt: number } | null>(null);
  const pendingTagMotionRef = useRef<{
    delaySidePanelTag: boolean;
    key: string;
    startedAt: number;
  } | null>(null);
  const sidePanelTagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeViewRef = useRef<NativePokemonHubView>(initialView);
  const selectedTagKeyRef = useRef<string | null>(resolvedInitialTagKey);
  const [pageScrollX] = useState(() => new Animated.Value(width));
  const [pageDragX] = useState(() => new Animated.Value(0));
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
  const sidePanelTag = useMemo(
    () => availableTags.find((tag) => tag.key === sidePanelTagKey)
      ?? (sidePanelTagKey === selectedTag?.key ? selectedTag : null),
    [availableTags, selectedTag, sidePanelTagKey],
  );
  const selectedRows = useMemo(
    () => selectedTag?.rows ?? (requireTagSelection ? [] : catalogRows),
    [catalogRows, requireTagSelection, selectedTag],
  );
  const selectedRowsRef = useRef(selectedRows);
  const selectedCountRef = useRef(selectedIds.size);
  selectedRowsRef.current = selectedRows;
  selectedCountRef.current = selectedIds.size;
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
    let interactionTask: ReturnType<typeof runAfterNativeUiInteractions> | null = null;
    const tagsToPrepare = availableTags.slice(0, 24);
    const searchRowGroups = [catalogRows, ...tagsToPrepare.map((tag) => tag.rows)];
    let tagIndex = 0;
    let searchGroupIndex = 0;
    let searchRowIndex = 0;
    const scheduleNext = (delay: number) => {
      timer = setTimeout(() => {
        interactionTask = runAfterNativeUiInteractions(prepareNext);
      }, delay);
    };
    const prepareNext = () => {
      if (cancelled) return;
      const tag = tagsToPrepare[tagIndex];
      if (tag) {
        prepareNativeCollectionParityRows(tag.rows);
        tagIndex += 1;
        scheduleNext(16);
        return;
      }
      const searchRows = searchRowGroups[searchGroupIndex];
      if (!searchRows) return;
      searchRowIndex = prepareNativeCollectionSearchRows(
        searchRows,
        searchRowIndex,
        128,
      );
      if (searchRowIndex >= searchRows.length) {
        searchGroupIndex += 1;
        searchRowIndex = 0;
      }
      scheduleNext(16);
    };
    // The active grid has committed before effects run. Prepare immutable tag
    // data in short idle slices so a later tag press only gives the one active
    // FlatList an already-sorted card projection. No native views are mounted
    // by this warm-up.
    scheduleNext(96);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      interactionTask?.cancel();
    };
  }, [availableTags, catalogRows]);

  useEffect(() => () => {
    pendingTagMotionRef.current = null;
    if (sidePanelTagTimerRef.current) clearTimeout(sidePanelTagTimerRef.current);
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
    // Vite's same-value state update is a no-op. Avoid starting a 300 ms
    // native animation and allocating panel textures when the selected tab is
    // tapped again.
    if (activeViewRef.current === view) return;
    // Commit the destination immediately so taps never wait for momentum to
    // settle before the selected tab becomes responsive. The underline still
    // follows pageScrollX continuously, so the visual indicator travels with
    // the native page rather than jumping ahead of it.
    activeViewRef.current = view;
    setActiveView(view);
    onContextChange?.({ activeView: view });
    sliderRef.current?.setPage(VIEW_ORDER.indexOf(view));
  }, [onContextChange]);
  const settlePageIndex = useCallback((index: number) => {
    const view = VIEW_ORDER[index] ?? 'pokemon';
    activeViewRef.current = view;
    setActiveView(view);
    onContextChange?.({ activeView: view });
  }, [onContextChange]);

  const startPendingTagMotion = useCallback(() => {
    const pending = pendingTagMotionRef.current;
    if (!pending) return;
    pendingTagMotionRef.current = null;
    if (pending.delaySidePanelTag) {
      // Vite starts this delay with its CSS transform. Keep the old side-panel
      // identity throughout motion and update it after the shared 300 ms.
      sidePanelTagTimerRef.current = setTimeout(() => {
        setSidePanelTagKey(pending.key);
        sidePanelTagTimerRef.current = null;
      }, NATIVE_HORIZONTAL_PAGE_TRANSITION_MS);
    }
    markNativeUiPerformance('collection_tag_slide_started', {
      interactionLatencyMs: Date.now() - pending.startedAt,
      tagKey: pending.key,
    });
    sliderRef.current?.setPage(VIEW_ORDER.indexOf('pokemon'));
  }, []);

  const commitCollectionRows = useCallback((visibleRowCount: number) => {
    if (query.trim()) {
      setVisibleCollectionCount((current) => (
        current === visibleRowCount ? current : visibleRowCount
      ));
    }
    startPendingTagMotion();
  }, [query, startPendingTagMotion]);

  const changeQuery = useCallback((nextQuery: string) => {
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
    if (sidePanelTagTimerRef.current) {
      clearTimeout(sidePanelTagTimerRef.current);
      sidePanelTagTimerRef.current = null;
    }
    const delaySidePanelTag = activeViewRef.current !== 'pokemon';
    if (!delaySidePanelTag) {
      setSidePanelTagKey(tag.key);
    }
    // Vite changes the immutable data projection in its one virtualized grid,
    // then starts the compositor slide. Native follows that same order: the
    // cached tag projection and the UI-thread track enter one native commit.
    // Keeping one grid avoids hundreds of image/card views from
    // invisible prewarmed lists competing with the animation.
    // Reset the already-mounted offscreen grid before changing its data. This
    // prevents FlatList from reconciling both a previously scrolled window and
    // its pinned top window, then discarding the former in a layout effect.
    collectionSurfaceRef.current?.resetScroll();
    const pokemonIndex = VIEW_ORDER.indexOf('pokemon');
    // Reserve the destination so the state commit can update the middle grid
    // before its layout effect begins motion.
    sliderRef.current?.preparePage(pokemonIndex);
    pendingTagMotionRef.current = {
      delaySidePanelTag,
      key: tag.key,
      startedAt,
    };
    if (selectedCountRef.current > 0) setSelectedIds(new Set());

    if (selectedTagKeyRef.current === tag.key) {
      setActiveView('pokemon');
      onContextChange?.({ activeView: 'pokemon', scrollOffset: 0 });
      // No destination data changes for a repeated tag, so no child layout
      // effect will run. Its existing card window is already ready to move.
      startPendingTagMotion();
      return;
    }

    // Match Vite's handleTagSelect: commit the filter and destination in one
    // update. The slider's layout effect begins the native-driven page motion
    // immediately after that commit; no list-layout readiness gate sits in
    // front of the interaction.
    selectedTagKeyRef.current = tag.key;
    setSelectedTagKey(tag.key);
    activeViewRef.current = 'pokemon';
    setActiveView('pokemon');
    onContextChange?.({
      activeView: 'pokemon',
      selectedTagKey: tag.key,
      scrollOffset: 0,
    });
  }, [onContextChange, startPendingTagMotion]);

  const toggleSelection = useCallback((entryId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);
  const openEntry = useCallback((
    row: NativeCollectionRow,
    orderedRows: NativeCollectionRow[],
  ) => {
    if (selectedCountRef.current > 0 || row.source === 'catalog') {
      toggleSelection(row.id);
      return;
    }
    onOpenEntry(
      row,
      orderedRows.filter((candidate) => candidate.source !== 'catalog'),
    );
  }, [onOpenEntry, toggleSelection]);
  const longPressEntry = useCallback((row: NativeCollectionRow) => {
    toggleSelection(row.id);
  }, [toggleSelection]);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const selectAll = useCallback(
    () => setSelectedIds(new Set(selectedRowsRef.current.map((row) => row.id))),
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
    if (sidePanelTagTimerRef.current) {
      clearTimeout(sidePanelTagTimerRef.current);
      sidePanelTagTimerRef.current = null;
    }
    setSidePanelTagKey(null);
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
      key="inventory"
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
      key="pokemon"
      activeTag={selectedTag}
      assetBaseUrl={assetBaseUrl}
      rows={selectedRows}
      searchUniverseRows={catalogRows}
      query={query}
      ref={collectionSurfaceRef}
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
      onRowsCommitted={commitCollectionRows}
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
    commitCollectionRows,
    openOrganizer,
  ]);
  const wishlistPanel = useMemo(() => (
    <NativeTagsPanelScreen
      key="wishlist"
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
  // Multiple JSX children normally allocate a new array on every Hub render,
  // which defeats NativeHorizontalPageSlider's memo even when every panel is
  // unchanged. Preserve the exact children reference so overlays, notices,
  // and delayed header-label updates cannot reconcile the paging surface.
  const pagePanels = useMemo(
    () => [inventoryPanel, pokemonPanel, wishlistPanel],
    [inventoryPanel, pokemonPanel, wishlistPanel],
  );

  return (
    <View style={[styles.screen, { backgroundColor: background }]} testID="native-collection-hub">
      <NativePokemonHubHeader
        activeTag={sidePanelTag?.filterName ?? sidePanelTag?.name ?? null}
        activeTagParent={sidePanelTag?.parent ?? null}
        activeView={activeView}
        backgroundColor={background}
        collectionCount={query.trim() ? visibleCollectionCount : selectedRows.length}
        inactiveTextColor={palette.headerInactive}
        onViewChange={changeView}
        scrollX={pageScrollX}
        dragX={pageDragX}
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
        dragX={pageDragX}
      >
        {pagePanels}
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
      {clearTagConfirmationOpen ? (
        <NativeConfirmationDialog
          body={buildClearActiveTagMessage(
            selectedTag?.filterName ?? selectedTag?.name ?? 'selected',
          )}
          confirmLabel={collectionExperienceParityContract.clearTagConfirmation.confirmLabel}
          onCancel={() => setClearTagConfirmationOpen(false)}
          onConfirm={confirmClearTag}
          title={collectionExperienceParityContract.clearTagConfirmation.title}
          visible
        />
      ) : null}
    </View>
  );
});

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

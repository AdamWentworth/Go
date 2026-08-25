import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import type {
  CreateCustomTagRequest,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import { collectionParityTokens } from '@pokemongonexus/shared-ui-tokens';
import {
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
} from '../components/NativeHorizontalPageSlider';
import type {
  NativeCollectionRow,
  NativeTagSummary,
} from '../features/collection/collectionModel';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../features/collection/NativePokemonHubHeader';
import { NativeCollectionParityScreen } from './NativeCollectionParityScreen';
import { NativeTagsPanelScreen } from './NativeTagsPanelScreen';
import { NativeActionMenu } from '../components/NativeActionMenu';
import { NativePokemonOrganizerSheet } from '../features/collection/NativePokemonOrganizerSheet';
import type { NativePokemonOrganizerRequest } from '../features/collection/useNativePokemonOrganizerMutation';

const VIEW_ORDER: NativePokemonHubView[] = ['inventory', 'pokemon', 'wishlist'];

type Props = {
  assetBaseUrl: string;
  catalogRows: NativeCollectionRow[];
  instances: Record<string, PokemonInstance>;
  inventoryTags: NativeTagSummary[];
  wishlistTags: NativeTagSummary[];
  error: string | null;
  warning?: string | null;
  isLoading: boolean;
  onActionMenuPress: () => void;
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
  onActionMenuPress,
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
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<NativePokemonHubView>('pokemon');
  const [selectedTagKey, setSelectedTagKey] = useState<string | null>(initialTagKey);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const [pageScrollX] = useState(() => new Animated.Value(width));
  const availableTags = useMemo(
    () => [...inventoryTags, ...wishlistTags],
    [inventoryTags, wishlistTags],
  );
  const selectedTag = availableTags.find((tag) => tag.key === selectedTagKey)
    ?? (requireTagSelection
      ? availableTags.find((tag) => tag.key === 'system:caught') ?? availableTags[0] ?? null
      : null);
  const selectedRows = selectedTag?.rows ?? (requireTagSelection ? [] : catalogRows);
  const selectedOrganizerRows = useMemo(
    () => selectedRows.filter((row) => selectedIds.has(row.id)),
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

  const changeView = useCallback((view: NativePokemonHubView) => {
    // Commit the destination immediately so taps never wait for momentum to
    // settle before the selected tab becomes responsive. The underline still
    // follows pageScrollX continuously, so the visual indicator travels with
    // the native page rather than jumping ahead of it.
    setActiveView(view);
    sliderRef.current?.setPage(VIEW_ORDER.indexOf(view));
  }, []);

  const selectTag = useCallback((tag: NativeTagSummary) => {
    setSelectedIds(new Set());
    setSelectedTagKey(tag.key);
    setQuery('');
    changeView('pokemon');
  }, [changeView]);

  const toggleSelection = useCallback((entryId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);
  const openEntry = useCallback((entryId: string, orderedEntryIds: string[]) => {
    const row = selectedRows.find((candidate) => candidate.id === entryId);
    if (!row) return;
    if (selectedIds.size > 0 || row.source === 'catalog') {
      toggleSelection(entryId);
      return;
    }
    const orderedRows = orderedEntryIds.flatMap((id) => {
      const candidate = selectedRows.find((entry) => entry.id === id);
      return candidate && candidate.source !== 'catalog' ? [candidate] : [];
    });
    onOpenEntry(row, orderedRows);
  }, [onOpenEntry, selectedIds.size, selectedRows, toggleSelection]);
  const longPressEntry = useCallback((entryId: string) => {
    const row = selectedRows.find((candidate) => candidate.id === entryId);
    if (row) toggleSelection(entryId);
  }, [selectedRows, toggleSelection]);

  const clearTag = useCallback(() => {
    if (requireTagSelection) return;
    setSelectedIds(new Set());
    setSelectedTagKey(null);
  }, [requireTagSelection]);
  const openActionMenu = useCallback(() => setActionMenuOpen(true), []);
  useEffect(() => {
    if (!operationNotice) return undefined;
    const timer = setTimeout(() => setOperationNotice(null), 4200);
    return () => clearTimeout(timer);
  }, [operationNotice]);
  const inventoryPanel = useMemo(() => (
    <NativeTagsPanelScreen
      activeTagName={selectedTag?.parent === 'caught' ? selectedTag.name : null}
      assetBaseUrl={assetBaseUrl}
      collectionCount={inventoryCount}
      error={error}
      warning={warning}
      isLoading={isLoading}
      onActionMenuPress={openActionMenu}
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
    openActionMenu,
    onRetry,
    onCreateTag,
    onDeleteTag,
    onSaveTagOrder,
    onUpdateTag,
    isSavingTags,
    tagEditingEnabled,
    selectTag,
    selectedTag,
    warning,
  ]);
  const pokemonPanel = useMemo(() => (
    <NativeCollectionParityScreen
      activeTag={selectedTag}
      assetBaseUrl={assetBaseUrl}
      rows={selectedRows}
      searchUniverseRows={catalogRows}
      query={query}
      isLoading={isLoading}
      error={error}
      onQueryChange={setQuery}
      onRetry={onRetry}
      onClearTag={clearTag}
      onViewChange={changeView}
      onOpenInstance={openEntry}
      onLongPressInstance={longPressEntry}
      onOpenCanonicalCollection={openActionMenu}
      showHeader={false}
      selectedIds={selectedIds}
      onClearSelection={() => setSelectedIds(new Set())}
      onSelectAll={() => setSelectedIds(new Set(selectedRows.map((row) => row.id)))}
      onSelectionActionPress={() => setOrganizerOpen(true)}
      selectionAction={selectedRowsAreCatalog ? 'add' : 'organize'}
      tagCanClear={!requireTagSelection && Boolean(selectedTag)}
    />
  ), [
    assetBaseUrl,
    changeView,
    clearTag,
    error,
    isLoading,
    openActionMenu,
    onRetry,
    openEntry,
    query,
    catalogRows,
    selectedRows,
    selectedTag,
    selectedIds,
    selectedRowsAreCatalog,
    requireTagSelection,
    longPressEntry,
  ]);
  const wishlistPanel = useMemo(() => (
    <NativeTagsPanelScreen
      activeTagName={selectedTag?.parent === 'wanted' ? selectedTag.name : null}
      assetBaseUrl={assetBaseUrl}
      collectionCount={inventoryCount}
      error={error}
      isLoading={isLoading}
      onActionMenuPress={openActionMenu}
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
    openActionMenu,
    onRetry,
    onCreateTag,
    onDeleteTag,
    onSaveTagOrder,
    onUpdateTag,
    isSavingTags,
    tagEditingEnabled,
    selectTag,
    selectedTag,
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
        onClearSelection={() => setSelectedIds(new Set())}
        onSelectAll={() => setSelectedIds(new Set(selectedRows.map((row) => row.id)))}
        secondaryTextColor={secondary}
        textColor={text}
        catalogOwner={catalogOwner}
        onReturnToContext={onReturnToContext}
      />
      {operationNotice ? (
        <View accessibilityLiveRegion="polite" style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{operationNotice}</Text>
        </View>
      ) : null}
      <NativeHorizontalPageSlider
        activeIndex={activeIndex}
        onIndexChange={(index) => setActiveView(VIEW_ORDER[index] ?? 'pokemon')}
        ref={sliderRef}
        scrollX={pageScrollX}
      >
        {inventoryPanel}
        {pokemonPanel}
        {wishlistPanel}
      </NativeHorizontalPageSlider>
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={assetBaseUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={(path) => {
            setActionMenuOpen(false);
            if (path === '/pokemon') return;
            if (onActionMenuNavigate) onActionMenuNavigate(path);
            else onActionMenuPress();
          }}
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

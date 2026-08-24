import { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native';
import type {
  CreateCustomTagRequest,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
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

const VIEW_ORDER: NativePokemonHubView[] = ['inventory', 'pokemon', 'wishlist'];

type Props = {
  assetBaseUrl: string;
  catalogRows: NativeCollectionRow[];
  inventoryTags: NativeTagSummary[];
  wishlistTags: NativeTagSummary[];
  error: string | null;
  warning?: string | null;
  isLoading: boolean;
  onActionMenuPress: () => void;
  onActionMenuNavigate?: (path: string) => void;
  onOpenEntry: (row: NativeCollectionRow) => void;
  onRetry: () => void;
  onCreateTag?: (request: CreateCustomTagRequest) => Promise<unknown>;
  onDeleteTag?: (tagId: string) => Promise<unknown>;
  onSaveTagOrder?: (parent: CustomTagParent, tagKeys: PokemonTagOrderKey[]) => Promise<unknown>;
  onUpdateTag?: (tagId: string, request: UpdateCustomTagRequest) => Promise<unknown>;
  isSavingTags?: boolean;
};

export const NativeCollectionHubScreen = ({
  assetBaseUrl,
  catalogRows,
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
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<NativePokemonHubView>('pokemon');
  const [selectedTag, setSelectedTag] = useState<NativeTagSummary | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const [pageScrollX] = useState(() => new Animated.Value(width));
  const selectedRows = selectedTag?.rows ?? catalogRows;
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
    sliderRef.current?.setPage(VIEW_ORDER.indexOf(view));
    setActiveView(view);
  }, []);

  const selectTag = useCallback((tag: NativeTagSummary) => {
    setSelectedTag(tag);
    setQuery('');
    changeView('pokemon');
  }, [changeView]);

  const openEntry = useCallback((entryId: string) => {
    const row = selectedRows.find((candidate) => candidate.id === entryId);
    if (row) onOpenEntry(row);
  }, [onOpenEntry, selectedRows]);

  const clearTag = useCallback(() => setSelectedTag(null), []);
  const openActionMenu = useCallback(() => setActionMenuOpen(true), []);
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
      onOpenCanonicalCollection={openActionMenu}
      showHeader={false}
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
        activeTag={selectedTag?.name ?? null}
        activeTagParent={selectedTag?.parent ?? null}
        activeView={activeView}
        backgroundColor={background}
        collectionCount={selectedRows.length}
        inactiveTextColor={palette.headerInactive}
        onViewChange={changeView}
        scrollX={pageScrollX}
        secondaryTextColor={secondary}
        textColor={text}
      />
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
});

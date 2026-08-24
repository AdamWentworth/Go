import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
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
  onOpenEntry: (row: NativeCollectionRow) => void;
  onRetry: () => void;
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
  onOpenEntry,
  onRetry,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<NativePokemonHubView>('pokemon');
  const [selectedTag, setSelectedTag] = useState<NativeTagSummary | null>(null);
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const selectedRows = selectedTag?.rows ?? catalogRows;
  const inventoryCount = inventoryTags.find(
    (tag) => tag.key === 'system:caught',
  )?.rows.length ?? 0;
  const background = light ? '#f8fff9' : webCssVarTokens.colors.bgApp;
  const text = light ? '#405753' : webCssVarTokens.colors.textPrimary;
  const secondary = light ? '#4b625e' : webCssVarTokens.colors.textSecondary;
  const activeIndex = VIEW_ORDER.indexOf(activeView);

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
  const inventoryPanel = useMemo(() => (
    <NativeTagsPanelScreen
      activeTagName={selectedTag?.parent === 'caught' ? selectedTag.name : null}
      assetBaseUrl={assetBaseUrl}
      collectionCount={inventoryCount}
      error={error}
      warning={warning}
      isLoading={isLoading}
      onActionMenuPress={onActionMenuPress}
      onRetry={onRetry}
      onSelectTag={selectTag}
      onViewChange={changeView}
      parent="caught"
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
    onActionMenuPress,
    onRetry,
    selectTag,
    selectedTag,
    warning,
  ]);
  const pokemonPanel = useMemo(() => (
    <NativeCollectionParityScreen
      activeTag={selectedTag}
      assetBaseUrl={assetBaseUrl}
      rows={selectedRows}
      query={query}
      isLoading={isLoading}
      error={error}
      onQueryChange={setQuery}
      onRetry={onRetry}
      onClearTag={clearTag}
      onViewChange={changeView}
      onOpenInstance={openEntry}
      onOpenCanonicalCollection={onActionMenuPress}
      showHeader={false}
    />
  ), [
    assetBaseUrl,
    changeView,
    clearTag,
    error,
    isLoading,
    onActionMenuPress,
    onRetry,
    openEntry,
    query,
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
      onActionMenuPress={onActionMenuPress}
      onRetry={onRetry}
      onSelectTag={selectTag}
      onViewChange={changeView}
      parent="wanted"
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
    onActionMenuPress,
    onRetry,
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
        onViewChange={changeView}
        secondaryTextColor={secondary}
        textColor={text}
      />
      <NativeHorizontalPageSlider
        activeIndex={activeIndex}
        onIndexChange={(index) => setActiveView(VIEW_ORDER[index] ?? 'pokemon')}
        ref={sliderRef}
      >
        {inventoryPanel}
        {pokemonPanel}
        {wishlistPanel}
      </NativeHorizontalPageSlider>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
});

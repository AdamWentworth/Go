import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
import { NativeHorizontalPageSlider } from '../components/NativeHorizontalPageSlider';
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
  const selectedRows = selectedTag?.rows ?? catalogRows;
  const background = light ? '#f8fff9' : webCssVarTokens.colors.bgApp;
  const text = light ? '#405753' : webCssVarTokens.colors.textPrimary;
  const secondary = light ? '#4b625e' : webCssVarTokens.colors.textSecondary;
  const activeIndex = VIEW_ORDER.indexOf(activeView);

  const selectTag = (tag: NativeTagSummary) => {
    setSelectedTag(tag);
    setQuery('');
    setActiveView('pokemon');
  };

  const openEntry = (entryId: string) => {
    const row = selectedRows.find((candidate) => candidate.id === entryId);
    if (row) onOpenEntry(row);
  };

  return (
    <View style={[styles.screen, { backgroundColor: background }]} testID="native-collection-hub">
      <NativePokemonHubHeader
        activeTag={selectedTag?.name ?? null}
        activeTagParent={selectedTag?.parent ?? null}
        activeView={activeView}
        backgroundColor={background}
        collectionCount={selectedRows.length}
        onViewChange={setActiveView}
        secondaryTextColor={secondary}
        textColor={text}
      />
      <NativeHorizontalPageSlider
        activeIndex={activeIndex}
        onIndexChange={(index) => setActiveView(VIEW_ORDER[index] ?? 'pokemon')}
      >
        <NativeTagsPanelScreen
          activeTagName={selectedTag?.parent === 'caught' ? selectedTag.name : null}
          assetBaseUrl={assetBaseUrl}
          collectionCount={catalogRows.length}
          error={error}
          warning={warning}
          isLoading={isLoading}
          onActionMenuPress={onActionMenuPress}
          onRetry={onRetry}
          onSelectTag={selectTag}
          onViewChange={setActiveView}
          parent="caught"
          showHeader={false}
          tags={inventoryTags}
        />
        <NativeCollectionParityScreen
          activeTag={selectedTag}
          assetBaseUrl={assetBaseUrl}
          rows={selectedRows}
          query={query}
          isLoading={isLoading}
          error={error}
          onQueryChange={setQuery}
          onRetry={onRetry}
          onClearTag={() => setSelectedTag(null)}
          onViewChange={setActiveView}
          onOpenInstance={openEntry}
          onOpenCanonicalCollection={onActionMenuPress}
          showHeader={false}
        />
        <NativeTagsPanelScreen
          activeTagName={selectedTag?.parent === 'wanted' ? selectedTag.name : null}
          assetBaseUrl={assetBaseUrl}
          collectionCount={catalogRows.length}
          error={error}
          isLoading={isLoading}
          onActionMenuPress={onActionMenuPress}
          onRetry={onRetry}
          onSelectTag={selectTag}
          onViewChange={setActiveView}
          parent="wanted"
          showHeader={false}
          tags={wishlistTags}
          warning={warning}
        />
      </NativeHorizontalPageSlider>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
});

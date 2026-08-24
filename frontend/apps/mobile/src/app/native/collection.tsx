import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { webCssVarTokens } from '@pokemongonexus/shared-ui-tokens';
import {
  buildNativeCatalogRows,
  buildNativeCollectionRows,
  buildNativeTagSummaries,
  type NativeCollectionRow,
  type NativeTagSummary,
} from '../../features/collection/collectionModel';
import type { NativePokemonHubView } from '../../features/collection/NativePokemonHubHeader';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { NativeCollectionParityScreen } from '../../screens/NativeCollectionParityScreen';
import { NativeTagsPanelScreen } from '../../screens/NativeTagsPanelScreen';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { DEFAULT_NATIVE_TAGS_ENVELOPE } from '../../features/collection/nativeTagsEnvelope';
import { NativePokemonHubHeader } from '../../features/collection/NativePokemonHubHeader';
import { NativeHorizontalPageSlider } from '../../components/NativeHorizontalPageSlider';

const VIEW_ORDER: NativePokemonHubView[] = ['inventory', 'pokemon', 'wishlist'];

export default function NativeCollectionRoute() {
  const router = useRouter();
  const light = useColorScheme() === 'light';
  const session = useNativeSession();
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<NativePokemonHubView>('pokemon');
  const [selectedTag, setSelectedTag] = useState<NativeTagSummary | null>(null);
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const instanceRows = useMemo<NativeCollectionRow[]>(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeCollectionRows(
      snapshotQuery.data.instances,
      snapshotQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [snapshotQuery.data]);
  const catalogRows = useMemo<NativeCollectionRow[]>(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeCatalogRows(
      snapshotQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [snapshotQuery.data]);
  const inventoryTags = useMemo(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeTagSummaries(
      instanceRows,
      snapshotQuery.data.instances,
      snapshotQuery.data.tags ?? DEFAULT_NATIVE_TAGS_ENVELOPE,
      'caught',
    );
  }, [instanceRows, snapshotQuery.data]);
  const wishlistTags = useMemo(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeTagSummaries(
      instanceRows,
      snapshotQuery.data.instances,
      snapshotQuery.data.tags ?? DEFAULT_NATIVE_TAGS_ENVELOPE,
      'wanted',
    );
  }, [instanceRows, snapshotQuery.data]);

  const selectTag = (tag: NativeTagSummary) => {
    setSelectedTag(tag);
    setQuery('');
    setActiveView('pokemon');
  };

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Fcollection" />;
  }

  const selectedRows = selectedTag?.rows ?? catalogRows;
  const background = light ? '#f8fff9' : webCssVarTokens.colors.bgApp;
  const text = light ? '#405753' : webCssVarTokens.colors.textPrimary;
  const secondary = light ? '#4b625e' : webCssVarTokens.colors.textSecondary;
  const activeIndex = VIEW_ORDER.indexOf(activeView);
  const openEntry = (entryId: string) => {
    const row = selectedRows.find((candidate) => candidate.id === entryId);
    router.push(row?.source === 'catalog' ? {
      pathname: '/native/collection/catalog/[variantId]',
      params: { variantId: entryId },
    } : {
      pathname: '/native/collection/[instanceId]',
      params: { instanceId: entryId },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
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
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          collectionCount={catalogRows.length}
          error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
          warning={snapshotQuery.data?.tagLoadWarning ?? null}
          isLoading={snapshotQuery.isPending}
          onActionMenuPress={() => router.replace('/web')}
          onRetry={() => void snapshotQuery.refetch()}
          onSelectTag={selectTag}
          onViewChange={setActiveView}
          parent="caught"
          showHeader={false}
          tags={inventoryTags}
        />
        <NativeCollectionParityScreen
          activeTag={selectedTag}
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          rows={selectedRows}
          query={query}
          isLoading={snapshotQuery.isPending}
          error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
          onQueryChange={setQuery}
          onRetry={() => void snapshotQuery.refetch()}
          onClearTag={() => setSelectedTag(null)}
          onViewChange={setActiveView}
          onOpenInstance={openEntry}
          onOpenCanonicalCollection={() => router.replace('/web')}
          showHeader={false}
        />
        <NativeTagsPanelScreen
          activeTagName={selectedTag?.parent === 'wanted' ? selectedTag.name : null}
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          collectionCount={catalogRows.length}
          error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
          isLoading={snapshotQuery.isPending}
          onActionMenuPress={() => router.replace('/web')}
          onRetry={() => void snapshotQuery.refetch()}
          onSelectTag={selectTag}
          onViewChange={setActiveView}
          parent="wanted"
          showHeader={false}
          tags={wishlistTags}
          warning={snapshotQuery.data?.tagLoadWarning ?? null}
        />
      </NativeHorizontalPageSlider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0 },
});

import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

export default function NativeCollectionRoute() {
  const router = useRouter();
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
      snapshotQuery.data.tags ?? {
        tags: [],
        orders: {
          caught: ['system:caught', 'system:favorites', 'system:trade'],
          wanted: ['system:wanted', 'system:most-wanted'],
        },
      },
      'caught',
    );
  }, [instanceRows, snapshotQuery.data]);
  const wishlistTags = useMemo(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeTagSummaries(
      instanceRows,
      snapshotQuery.data.instances,
      snapshotQuery.data.tags ?? {
        tags: [],
        orders: {
          caught: ['system:caught', 'system:favorites', 'system:trade'],
          wanted: ['system:wanted', 'system:most-wanted'],
        },
      },
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

  if (activeView === 'inventory' || activeView === 'wishlist') {
    return (
      <NativeTagsPanelScreen
        activeTagName={selectedTag?.name ?? null}
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        collectionCount={catalogRows.length}
        error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
        isLoading={snapshotQuery.isPending}
        onActionMenuPress={() => router.replace('/web')}
        onRetry={() => void snapshotQuery.refetch()}
        onSelectTag={selectTag}
        onViewChange={setActiveView}
        parent={activeView === 'inventory' ? 'caught' : 'wanted'}
        tags={activeView === 'inventory' ? inventoryTags : wishlistTags}
      />
    );
  }

  return (
    <NativeCollectionParityScreen
      activeTag={selectedTag}
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      rows={selectedTag?.rows ?? catalogRows}
      query={query}
      isLoading={snapshotQuery.isPending}
      error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
      onQueryChange={setQuery}
      onRetry={() => void snapshotQuery.refetch()}
      onClearTag={() => setSelectedTag(null)}
      onViewChange={setActiveView}
      onOpenInstance={(instanceId) => router.push({
        pathname: '/native/collection/[instanceId]',
        params: { instanceId },
      })}
      onOpenCanonicalCollection={() => router.replace('/web')}
    />
  );
}

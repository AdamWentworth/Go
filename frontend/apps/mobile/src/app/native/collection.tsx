import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import { buildNativeCollectionRows } from '../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { NativeCollectionScreen } from '../../screens/NativeCollectionScreen';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeSession } from '../../auth/NativeSessionContext';

export default function NativeCollectionRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const [filter, setFilter] = useState<'all' | 'caught' | 'trade' | 'wanted'>('all');
  const [query, setQuery] = useState('');
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const rows = useMemo<NativeCollectionRow[]>(() => {
    if (!snapshotQuery.data) return [];
    return buildNativeCollectionRows(
      snapshotQuery.data.instances,
      snapshotQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [snapshotQuery.data]);

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native" />;
  }

  return <NativeCollectionScreen
    rows={rows}
    filter={filter}
    query={query}
    isLoading={snapshotQuery.isPending}
    error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
    onFilterChange={setFilter}
    onQueryChange={setQuery}
    onRetry={() => void snapshotQuery.refetch()}
    onBack={() => router.back()}
    onOpenCurrentApp={() => router.replace('/web')}
  />;
}

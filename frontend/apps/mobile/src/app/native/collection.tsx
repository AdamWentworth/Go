import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import { buildNativeCollectionRows } from '../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { NativeCollectionParityScreen } from '../../screens/NativeCollectionParityScreen';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeSession } from '../../auth/NativeSessionContext';

export default function NativeCollectionRoute() {
  const router = useRouter();
  const session = useNativeSession();
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
    return <Redirect href="/native/login?returnTo=%2Fnative%2Fcollection" />;
  }

  return (
    <NativeCollectionParityScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      rows={rows}
      query={query}
      isLoading={snapshotQuery.isPending}
      error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
      onQueryChange={setQuery}
      onRetry={() => void snapshotQuery.refetch()}
      onOpenInstance={(instanceId) => router.push({
        pathname: '/native/collection/[instanceId]',
        params: { instanceId },
      })}
      onOpenCanonicalCollection={() => router.replace('/web')}
    />
  );
}

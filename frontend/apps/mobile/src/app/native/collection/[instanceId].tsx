import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import {
  useNativeCollectionSnapshotQuery,
  useNativePokemonMovesQuery,
} from '../../../features/collection/collectionQueries';
import { buildNativeInstanceDetail } from '../../../features/collection/collectionModel';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { NativeInstanceDetailScreen } from '../../../screens/NativeInstanceDetailScreen';

export default function NativeInstanceDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ instanceId?: string | string[] }>();
  const session = useNativeSession();
  const instanceId = Array.isArray(params.instanceId)
    ? params.instanceId[0] ?? ''
    : params.instanceId ?? '';
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const movesQuery = useNativePokemonMovesQuery(Boolean(session.user));
  const detail = useMemo(() => {
    if (!snapshotQuery.data || !instanceId) return null;
    return buildNativeInstanceDetail(
      snapshotQuery.data.instances,
      snapshotQuery.data.catalog,
      movesQuery.data ?? [],
      instanceId,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [instanceId, movesQuery.data, snapshotQuery.data]);

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native" />;
  }

  return <NativeInstanceDetailScreen
    detail={detail}
    isLoading={snapshotQuery.isPending}
    error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
    movesWarning={movesQuery.error instanceof Error
      ? 'Move names are temporarily unavailable. The rest of this Pokémon is still current.'
      : null}
    onRetry={() => void Promise.all([snapshotQuery.refetch(), movesQuery.refetch()])}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/native/collection')}
    onEditInCurrentApp={() => router.replace('/web')}
  />;
}

import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import {
  useNativeCollectionSnapshotQuery,
  useNativePokemonMovesQuery,
} from '../../../features/collection/collectionQueries';
import {
  buildNativeCollectionRows,
  buildNativeInstanceDetail,
} from '../../../features/collection/collectionModel';
import { resolveNativeInstanceNeighbors } from '../../../features/collection/nativeInstanceNavigationContext';
import { useNativeFavoriteMutation } from '../../../features/collection/useNativeFavoriteMutation';
import { useNativeInstanceDetailMutation } from '../../../features/collection/useNativeInstanceDetailMutation';
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
  const favoriteMutation = useNativeFavoriteMutation(
    session.user?.user_id ?? '',
    instanceId,
  );
  const detailMutation = useNativeInstanceDetailMutation(
    session.user?.user_id ?? '',
    instanceId,
  );
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
  const neighbors = useMemo(() => {
    if (!snapshotQuery.data) return { previousId: null, nextId: null };
    const fallbackIds = buildNativeCollectionRows(
      snapshotQuery.data.instances,
      snapshotQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    ).map((row) => row.id);
    return resolveNativeInstanceNeighbors({ instanceId, fallbackIds });
  }, [instanceId, snapshotQuery.data]);
  const navigateToInstance = (nextInstanceId: string) => router.replace({
    pathname: '/native/collection/[instanceId]',
    params: { instanceId: nextInstanceId },
  });

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native" />;
  }

  const supportsSiblingNavigation = detail?.row.status === 'caught' || detail?.row.status === 'trade';

  return <NativeInstanceDetailScreen
    assetBaseUrl={runtimeConfig.api.frontendAppUrl}
    detail={detail}
    isLoading={snapshotQuery.isPending}
    error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
    cachedAt={snapshotQuery.data?.cachedAt ?? null}
    movesWarning={movesQuery.error instanceof Error
      ? 'Move names are temporarily unavailable. The rest of this Pokémon is still current.'
      : null}
    saveNotice={detailMutation.data?.message ?? favoriteMutation.data?.message ?? null}
    saveError={detailMutation.error instanceof Error
      ? detailMutation.error.message
      : favoriteMutation.error instanceof Error
        ? favoriteMutation.error.message
        : null}
    isSaving={favoriteMutation.isPending || detailMutation.isPending}
    onRetry={() => void Promise.all([snapshotQuery.refetch(), movesQuery.refetch()])}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/native/collection')}
    onNext={supportsSiblingNavigation && neighbors.nextId ? () => navigateToInstance(neighbors.nextId!) : undefined}
    onOpenTarget={navigateToInstance}
    onPrevious={supportsSiblingNavigation && neighbors.previousId ? () => navigateToInstance(neighbors.previousId!) : undefined}
    onToggleFavorite={(favorite) => favoriteMutation.mutate(favorite)}
    onSaveDetails={(patch) => detailMutation.mutateAsync(patch)}
    onEditPreferences={() => router.push({
      pathname: '/native/trades',
      params: {
        instance: instanceId,
        mode: detail?.row.status === 'wanted' ? 'wanted' : 'trade',
        section: 'preferences',
      },
    })}
  />;
}

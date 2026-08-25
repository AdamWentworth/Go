import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../../../auth/NativeSessionContext';
import {
  buildNativeCollectionRows,
  buildNativeInstanceDetail,
} from '../../../../../features/collection/collectionModel';
import {
  useNativeForeignCollectionQuery,
  useNativePokemonMovesQuery,
} from '../../../../../features/collection/collectionQueries';
import { resolveNativeInstanceNeighbors } from '../../../../../features/collection/nativeInstanceNavigationContext';
import { runtimeConfig } from '../../../../../config/runtimeConfig';
import { NativeInstanceDetailScreen } from '../../../../../screens/NativeInstanceDetailScreen';

const firstParam = (value: string | string[] | undefined): string => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

export default function NativeForeignInstanceRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    instanceId?: string | string[];
    username?: string | string[];
  }>();
  const session = useNativeSession();
  const username = firstParam(params.username).trim();
  const instanceId = firstParam(params.instanceId).trim();
  const foreignQuery = useNativeForeignCollectionQuery(
    session.user?.user_id ?? null,
    username,
  );
  const movesQuery = useNativePokemonMovesQuery(Boolean(session.user));
  const success = foreignQuery.data?.type === 'success' ? foreignQuery.data : null;
  const rows = useMemo(() => success ? buildNativeCollectionRows(
    success.instances,
    success.catalog,
    runtimeConfig.api.frontendAppUrl,
  ) : [], [success]);
  const detail = useMemo(() => success ? buildNativeInstanceDetail(
    success.instances,
    success.catalog,
    movesQuery.data ?? [],
    instanceId,
    runtimeConfig.api.frontendAppUrl,
  ) : null, [instanceId, movesQuery.data, success]);
  const neighbors = useMemo(() => resolveNativeInstanceNeighbors({
    instanceId,
    fallbackIds: rows
      .filter((row) => row.status === detail?.row.status)
      .map((row) => row.id),
  }), [detail?.row.status, instanceId, rows]);
  const resultError = foreignQuery.error instanceof Error
    ? foreignQuery.error.message
    : foreignQuery.data?.type === 'forbidden'
      ? foreignQuery.data.message
      : foreignQuery.data?.type === 'not-found'
        ? 'This trainer could not be found.'
        : !foreignQuery.isPending && success && !detail
          ? 'This listing is no longer available.'
          : null;

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native" />;
  }

  const navigateToInstance = (nextInstanceId: string) => router.replace({
    pathname: '/native/collection/trainer/[username]/[instanceId]',
    params: { username: success?.username ?? username, instanceId: nextInstanceId },
  });
  const returnToCatalog = () => {
    if (router.canGoBack()) router.back();
    else router.replace({
      pathname: '/native/collection/trainer/[username]',
      params: { username: success?.username ?? username, filter: detail?.row.status ?? 'caught' },
    });
  };

  return (
    <NativeInstanceDetailScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      cachedAt={null}
      canEdit={false}
      detail={detail}
      error={resultError}
      isLoading={foreignQuery.isPending}
      isSaving={false}
      movesWarning={movesQuery.error instanceof Error
        ? 'Move names are temporarily unavailable. The rest of this Pokémon is still current.'
        : null}
      onBack={returnToCatalog}
      onEditInCurrentApp={() => undefined}
      onNext={neighbors.nextId ? () => navigateToInstance(neighbors.nextId!) : undefined}
      onOpenTarget={navigateToInstance}
      onPrevious={neighbors.previousId ? () => navigateToInstance(neighbors.previousId!) : undefined}
      onRetry={() => void Promise.all([foreignQuery.refetch(), movesQuery.refetch()])}
      onToggleFavorite={() => undefined}
      saveError={null}
      saveNotice={null}
    />
  );
}

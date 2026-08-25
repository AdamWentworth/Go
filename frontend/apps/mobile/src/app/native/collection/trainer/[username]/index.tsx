import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../../../auth/NativeSessionContext';
import {
  buildNativeCollectionRows,
  buildNativeTagSummaries,
  type NativeCollectionRow,
} from '../../../../../features/collection/collectionModel';
import { useNativeForeignCollectionQuery } from '../../../../../features/collection/collectionQueries';
import { DEFAULT_NATIVE_TAGS_ENVELOPE } from '../../../../../features/collection/nativeTagsEnvelope';
import { setNativeInstanceNavigationContext } from '../../../../../features/collection/nativeInstanceNavigationContext';
import { runtimeConfig } from '../../../../../config/runtimeConfig';
import { NativeCollectionHubScreen } from '../../../../../screens/NativeCollectionHubScreen';
import { resolveNativeActionMenuDestination } from '../../../../../navigation/nativeActionMenuNavigation';

const firstParam = (value: string | string[] | undefined): string => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

const initialForeignTagKey = (filter: string): string => {
  const normalized = filter.trim().toLocaleLowerCase().replaceAll('_', '-');
  if (normalized === 'trade' || normalized === 'for-trade') return 'system:trade';
  if (normalized === 'wanted') return 'system:wanted';
  if (normalized === 'most-wanted') return 'system:most-wanted';
  if (normalized === 'favorites') return 'system:favorites';
  return 'system:caught';
};

export default function NativeForeignCollectionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    filter?: string | string[];
    username?: string | string[];
  }>();
  const session = useNativeSession();
  const username = firstParam(params.username).trim();
  const foreignQuery = useNativeForeignCollectionQuery(
    session.user?.user_id ?? null,
    username,
  );
  const success = foreignQuery.data?.type === 'success' ? foreignQuery.data : null;
  const rows = useMemo<NativeCollectionRow[]>(() => {
    if (!success) return [];
    return buildNativeCollectionRows(
      success.instances,
      success.catalog,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [success]);
  const inventoryTags = useMemo(() => buildNativeTagSummaries(
    rows,
    success?.instances ?? {},
    DEFAULT_NATIVE_TAGS_ENVELOPE,
    'caught',
  ), [rows, success?.instances]);
  const wishlistTags = useMemo(() => buildNativeTagSummaries(
    rows,
    success?.instances ?? {},
    DEFAULT_NATIVE_TAGS_ENVELOPE,
    'wanted',
  ), [rows, success?.instances]);
  const initialTagKey = initialForeignTagKey(firstParam(params.filter));
  const resultError = foreignQuery.error instanceof Error
    ? foreignQuery.error.message
    : foreignQuery.data?.type === 'forbidden'
      ? foreignQuery.data.message
      : foreignQuery.data?.type === 'not-found'
        ? 'This trainer could not be found.'
        : null;

  if (session.status !== 'signed-in' || !session.user) {
    const returnTo = encodeURIComponent(`/native/collection/trainer/${encodeURIComponent(username)}`);
    return <Redirect href={`/native/login?returnTo=${returnTo}`} />;
  }

  const returnToContext = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/native/collection');
  };
  const openEntry = (row: NativeCollectionRow, orderedRows: NativeCollectionRow[]) => {
    if (row.source === 'catalog') return;
    setNativeInstanceNavigationContext(orderedRows.map((entry) => entry.id));
    router.push({
      pathname: '/native/collection/trainer/[username]/[instanceId]',
      params: { username: success?.username ?? username, instanceId: row.id },
    });
  };
  const navigateFromActionMenu = (path: string) => {
    const destination = resolveNativeActionMenuDestination(path);
    if (destination.kind === 'current') return;
    if (destination.kind === 'native') {
      router.push(destination.pathname);
      return;
    }
    router.push({ pathname: '/web', params: { path: destination.path } });
  };

  return (
    <NativeCollectionHubScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      catalogOwner={success?.username ?? username}
      catalogRows={rows}
      error={resultError}
      initialTagKey={initialTagKey}
      instances={success?.instances ?? {}}
      inventoryTags={inventoryTags}
      isLoading={foreignQuery.isPending}
      onActionMenuNavigate={navigateFromActionMenu}
      onActionMenuPress={() => router.push('/web')}
      onOpenEntry={openEntry}
      onRetry={() => void foreignQuery.refetch()}
      onReturnToContext={returnToContext}
      requireTagSelection
      wishlistTags={wishlistTags}
    />
  );
}

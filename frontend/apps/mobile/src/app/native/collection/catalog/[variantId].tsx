import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../../auth/NativeSessionContext';
import { runtimeConfig } from '../../../../config/runtimeConfig';
import { buildNativeCatalogRows } from '../../../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../../../features/collection/collectionQueries';
import { useNativeCatalogAddition } from '../../../../features/collection/useNativeCatalogAddition';
import { NativeCatalogDetailScreen } from '../../../../screens/NativeCatalogDetailScreen';
import { NativeProtectedSessionGate } from '../../../../components/NativeProtectedSessionGate';

export default function NativeCatalogDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ variantId?: string | string[] }>();
  const session = useNativeSession();
  const variantId = Array.isArray(params.variantId)
    ? params.variantId[0] ?? ''
    : params.variantId ?? '';
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const mutation = useNativeCatalogAddition(session.user?.user_id ?? '', variantId);
  const row = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return buildNativeCatalogRows(
      snapshotQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    ).find((candidate) => candidate.id === variantId) ?? null;
  }, [snapshotQuery.data, variantId]);

  if (session.status === 'restoring' || session.status === 'unavailable') {
    return (
      <NativeProtectedSessionGate
        message="Opening Pokémon…"
        onRetry={session.retrySession}
        status={session.status}
      />
    );
  }

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Fcollection" />;
  }

  return (
    <NativeCatalogDetailScreen
      error={mutation.error instanceof Error
        ? mutation.error.message
        : snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
      isLoading={snapshotQuery.isPending}
      isSaving={mutation.isPending}
      notice={mutation.data?.message ?? null}
      onAdd={(destination) => mutation.mutate(destination)}
      onBack={() => router.canGoBack() ? router.back() : router.replace('/native/collection')}
      row={row}
    />
  );
}

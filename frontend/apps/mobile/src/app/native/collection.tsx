import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  buildNativeCatalogRows,
  buildNativeCollectionRows,
  buildNativeTagSummaries,
  type NativeCollectionRow,
} from '../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { DEFAULT_NATIVE_TAGS_ENVELOPE } from '../../features/collection/nativeTagsEnvelope';
import { useNativeTagMutations } from '../../features/collection/useNativeTagMutations';
import { useNativeCatalogOrganizerMutation } from '../../features/collection/useNativeCatalogOrganizerMutation';
import { NativeCollectionHubScreen } from '../../screens/NativeCollectionHubScreen';

export default function NativeCollectionRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const tagMutations = useNativeTagMutations(session.user?.user_id ?? 'signed-out');
  const catalogOrganizer = useNativeCatalogOrganizerMutation(
    session.user?.user_id ?? 'signed-out',
  );
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

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Fcollection" />;
  }

  const openEntry = (row: NativeCollectionRow) => {
    router.push(row?.source === 'catalog' ? {
      pathname: '/native/collection/catalog/[variantId]',
      params: { variantId: row.id },
    } : {
      pathname: '/native/collection/[instanceId]',
      params: { instanceId: row.id },
    });
  };

  return (
    <NativeCollectionHubScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      catalogRows={catalogRows}
      error={snapshotQuery.error instanceof Error ? snapshotQuery.error.message : null}
      inventoryTags={inventoryTags}
      isLoading={snapshotQuery.isPending}
      onActionMenuNavigate={(path) => router.push({
        pathname: '/web',
        params: { path },
      })}
      onActionMenuPress={() => router.push('/web')}
      onOpenEntry={openEntry}
      onOrganizeCatalog={(request) => catalogOrganizer.mutateAsync(request)}
      onRetry={() => void snapshotQuery.refetch()}
      onCreateTag={tagMutations.createTag}
      onDeleteTag={tagMutations.deleteTag}
      onSaveTagOrder={tagMutations.saveOrder}
      onUpdateTag={tagMutations.updateTag}
      isSavingTags={tagMutations.isPending}
      isOrganizingCatalog={catalogOrganizer.isPending}
      organizerError={catalogOrganizer.error instanceof Error
        ? catalogOrganizer.error.message
        : null}
      warning={snapshotQuery.data?.tagLoadWarning ?? null}
      wishlistTags={wishlistTags}
    />
  );
}

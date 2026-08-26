import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { useNativeCollectionSnapshotQuery } from '../../../features/collection/collectionQueries';
import { buildNativePokedexEntries } from '../../../features/tools/nativePokedexModel';
import { useNativePokedexRegistrationsQuery } from '../../../features/tools/nativePokedexQueries';
import { useNativeToolCatalogQuery } from '../../../features/tools/nativeToolQueries';
import { resolveNativeActionMenuDestination } from '../../../navigation/nativeActionMenuNavigation';
import { NativePokedexScreen } from '../../../screens/NativePokedexScreen';

export default function NativePokedexRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const catalogQuery = useNativeToolCatalogQuery();
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const registrationsQuery = useNativePokedexRegistrationsQuery(session.user?.user_id ?? null);
  const [menu, setMenu] = useState(false);
  const entries = useMemo(() => buildNativePokedexEntries(
    catalogQuery.data ?? [],
    snapshotQuery.data?.instances ?? {},
    registrationsQuery.data ?? [],
  ), [catalogQuery.data, registrationsQuery.data, snapshotQuery.data?.instances]);
  const navigate = (path: string) => {
    setMenu(false);
    const destination = resolveNativeActionMenuDestination(path, '/pokedex');
    if (destination.kind === 'current') return;
    if (destination.kind === 'native') { router.push(destination.pathname); return; }
    router.push({ pathname: '/web', params: { path: destination.path } });
  };
  return <>
    <NativePokedexScreen assetBaseUrl={runtimeConfig.api.frontendAppUrl} entries={entries} error={catalogQuery.error instanceof Error ? catalogQuery.error.message : null} isLoading={catalogQuery.isPending} onBack={() => router.canGoBack() ? router.back() : router.replace('/native')} onOpenEntry={(entry) => router.push({ pathname: '/native/pokedex/[variantId]', params: { variantId: entry.id } })} onRetry={() => void catalogQuery.refetch()} />
    <NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setMenu(true)} />
    {menu ? <NativeActionMenu assetBaseUrl={runtimeConfig.api.frontendAppUrl} onClose={() => setMenu(false)} onNavigate={navigate} visible /> : null}
  </>;
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import { buildNativePokedexEntries } from '../../../features/tools/nativePokedexModel';
import {
  useNativePokedexRegistrationMutation,
  useNativePokedexRegistrationsQuery,
} from '../../../features/tools/nativePokedexQueries';
import { useNativeToolCatalogQuery } from '../../../features/tools/nativeToolQueries';
import { useNativeCollectionSnapshotQuery } from '../../../features/collection/collectionQueries';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { NativePokedexDetailScreen } from '../../../screens/NativePokedexDetailScreen';

export default function NativePokedexDetailRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const params = useLocalSearchParams<{ variantId?: string | string[] }>();
  const variantId = Array.isArray(params.variantId) ? params.variantId[0] ?? '' : params.variantId ?? '';
  const query = useNativeToolCatalogQuery();
  const userId = session.user?.user_id ?? null;
  const snapshotQuery = useNativeCollectionSnapshotQuery(userId);
  const registrationsQuery = useNativePokedexRegistrationsQuery(userId);
  const mutation = useNativePokedexRegistrationMutation(userId);
  const entries = useMemo(() => buildNativePokedexEntries(
    query.data ?? [],
    snapshotQuery.data?.instances ?? {},
    registrationsQuery.data ?? [],
  ), [query.data, registrationsQuery.data, snapshotQuery.data?.instances]);
  const entry = useMemo(() => entries.find(({ id }) => id === variantId) ?? null, [entries, variantId]);
  const pokemon = query.data?.find(({ pokemon_id }) => pokemon_id === entry?.pokemonId) ?? null;
  return <NativePokedexDetailScreen
    allEntries={entries}
    assetBaseUrl={runtimeConfig.api.frontendAppUrl}
    entry={entry}
    error={mutation.error instanceof Error ? mutation.error.message : null}
    isSaving={mutation.isPending}
    onBack={() => router.canGoBack() ? router.back() : router.replace('/native/pokedex')}
    onManage={(selected) => {
      if (!session.user) { router.push('/native/login?returnTo=%2Fnative%2Fpokedex'); return; }
      router.push({ pathname: '/native/collection/catalog/[variantId]', params: { variantId: selected.id } });
    }}
    onOpenEntry={(selected) => router.replace({ pathname: '/native/pokedex/[variantId]', params: { variantId: selected.id } })}
    onToggleRegistration={(registration, registered) => mutation.mutate({ registrations: [registration], registered })}
    pokemon={pokemon}
    signedIn={Boolean(session.user)}
  />;
}

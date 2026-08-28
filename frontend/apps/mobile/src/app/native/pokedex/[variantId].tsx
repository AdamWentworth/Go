import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import { buildNativePokedexEntries, mergeNativePokedexSpecies } from '../../../features/tools/nativePokedexModel';
import {
  useNativePokedexRegistrationMutation,
  useNativePokedexRegistrationsQuery,
} from '../../../features/tools/nativePokedexQueries';
import { useNativePokedexSpeciesQuery, useNativeToolCatalogQuery } from '../../../features/tools/nativeToolQueries';
import { useNativeCollectionSnapshotQuery } from '../../../features/collection/collectionQueries';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { NativeRouteActionMenu } from '../../../components/NativeRouteActionMenu';
import { NativePokedexDetailScreen } from '../../../screens/NativePokedexDetailScreen';

export default function NativePokedexDetailRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const params = useLocalSearchParams<{ variantId?: string | string[] }>();
  const variantId = Array.isArray(params.variantId) ? params.variantId[0] ?? '' : params.variantId ?? '';
  const query = useNativeToolCatalogQuery();
  const speciesQuery = useNativePokedexSpeciesQuery();
  const userId = session.user?.user_id ?? null;
  const snapshotQuery = useNativeCollectionSnapshotQuery(userId);
  const registrationsQuery = useNativePokedexRegistrationsQuery(userId);
  const mutation = useNativePokedexRegistrationMutation(userId);
  const mergedCatalog = useMemo(() => mergeNativePokedexSpecies(
    query.data ?? [],
    speciesQuery.data ?? [],
  ), [query.data, speciesQuery.data]);
  const entries = useMemo(() => buildNativePokedexEntries(
    mergedCatalog,
    snapshotQuery.data?.instances ?? {},
    registrationsQuery.data ?? [],
  ), [mergedCatalog, registrationsQuery.data, snapshotQuery.data?.instances]);
  const entry = useMemo(() => entries.find(({ id }) => id === variantId) ?? null, [entries, variantId]);
  const pokemon = mergedCatalog.find(({ pokemon_id }) => pokemon_id === entry?.pokemonId) ?? null;
  return (
    <>
      <NativePokedexDetailScreen
        allEntries={entries}
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        entry={entry}
        error={mutation.error instanceof Error ? mutation.error.message : null}
        isSaving={mutation.isPending}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/native/pokedex')}
        onOpenEntry={(selected) => router.replace({ pathname: '/native/pokedex/[variantId]', params: { variantId: selected.id } })}
        onSetRegistrations={(registrations, registered) => mutation.mutate({ registrations, registered })}
        onToggleRegistration={(registration, registered) => mutation.mutate({ registrations: [registration], registered })}
        pokemon={pokemon}
        signedIn={Boolean(session.user)}
      />
      <NativeRouteActionMenu currentPath="/pokedex" signedIn={Boolean(session.user)} />
    </>
  );
}

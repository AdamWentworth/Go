import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import { buildNativePokedexEntries } from '../../../features/tools/nativePokedexModel';
import { useNativeToolCatalogQuery } from '../../../features/tools/nativeToolQueries';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { NativePokedexDetailScreen } from '../../../screens/NativePokedexDetailScreen';

export default function NativePokedexDetailRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const params = useLocalSearchParams<{ variantId?: string | string[] }>();
  const variantId = Array.isArray(params.variantId) ? params.variantId[0] ?? '' : params.variantId ?? '';
  const query = useNativeToolCatalogQuery();
  const entry = useMemo(() => buildNativePokedexEntries(query.data ?? []).find(({ id }) => id === variantId) ?? null, [query.data, variantId]);
  const pokemon = query.data?.find(({ pokemon_id }) => pokemon_id === entry?.pokemonId) ?? null;
  return <NativePokedexDetailScreen assetBaseUrl={runtimeConfig.api.frontendAppUrl} entry={entry} onAdd={() => {
    if (!session.user) { router.push('/native/login?returnTo=%2Fnative%2Fpokedex'); return; }
    router.push({ pathname: '/native/collection/catalog/[variantId]', params: { variantId } });
  }} onBack={() => router.canGoBack() ? router.back() : router.replace('/native/pokedex')} pokemon={pokemon} signedIn={Boolean(session.user)} />;
}

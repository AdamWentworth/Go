import { ApiClientError } from '@pokemongonexus/shared-api-client';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import { buildNativeCollectionRows } from '../../features/collection/collectionModel';
import { NativeCollectionScreen } from '../../screens/NativeCollectionScreen';
import { getNativeCollectionSnapshot } from '../../services/collectionApi';
import {
  createNativePokemonApiClient,
  createNativeUsersApiClient,
} from '../../services/nativeApiClients';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeSession } from '../../auth/NativeSessionContext';

export default function NativeCollectionRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const [rows, setRows] = useState<NativeCollectionRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'caught' | 'trade' | 'wanted'>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const usersApi = useMemo(() => createNativeUsersApiClient({
    getAccessToken: session.getAccessToken,
    refreshAccessToken: session.refreshAccessToken,
    clearSession: session.clearSession,
  }), [session.clearSession, session.getAccessToken, session.refreshAccessToken]);
  const pokemonApi = useMemo(() => createNativePokemonApiClient(), []);

  const loadCollection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await getNativeCollectionSnapshot(usersApi, pokemonApi);
      setRows(buildNativeCollectionRows(
        snapshot.instances,
        snapshot.catalog,
        runtimeConfig.api.frontendAppUrl,
      ));
    } catch (loadError) {
      setError(
        loadError instanceof ApiClientError || loadError instanceof Error
          ? loadError.message
          : 'Unable to load your collection.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [pokemonApi, usersApi]);

  useEffect(() => {
    if (session.status === 'signed-in') void loadCollection();
  }, [loadCollection, session.status]);

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native" />;
  }

  return <NativeCollectionScreen
    rows={rows}
    filter={filter}
    query={query}
    isLoading={isLoading}
    error={error}
    onFilterChange={setFilter}
    onQueryChange={setQuery}
    onRetry={() => void loadCollection()}
    onBack={() => router.back()}
    onOpenCurrentApp={() => router.replace('/web')}
  />;
}

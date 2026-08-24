import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  pokemonContract,
  type BasePokemon,
  type PokemonMovesChunk,
} from '@pokemongonexus/shared-contracts/pokemon';
import {
  usersContract,
  type CustomTagsEnvelope,
  type InstanceSyncEnvelope,
} from '@pokemongonexus/shared-contracts/users';
import type {
  NativePokemonApiClient,
  NativeUsersApiClient,
} from './nativeApiClients';
import {
  projectNativeCollectionOutbox,
  reconcileAcknowledgedNativeCollectionBatches,
} from '../features/collection/collectionSyncCoordinator';
import type { nativeCollectionOutbox } from '../storage/nativeCollectionOutbox';
import type {
  NativeCachedCollectionSnapshot,
  nativeCollectionCache,
} from '../storage/nativeCollectionCache';

export type NativeCollectionSnapshot = {
  instances: Record<string, PokemonInstance>;
  catalog: BasePokemon[];
  tags?: CustomTagsEnvelope;
};

export type NativeResolvedCollectionSnapshot = NativeCollectionSnapshot & {
  source: 'network' | 'cache';
  cachedAt: number | null;
};

export const getNativeCollectionSnapshot = async (
  usersClient: Pick<NativeUsersApiClient, 'get'>,
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
): Promise<NativeCollectionSnapshot> => {
  const [instanceEnvelope, catalog, tags] = await Promise.all([
    usersClient.get<InstanceSyncEnvelope<PokemonInstance>>(
      usersContract.endpoints.instanceSync,
    ),
    pokemonClient.get<BasePokemon[]>(pokemonContract.endpoints.catalog),
    usersClient.get<CustomTagsEnvelope>(usersContract.endpoints.tags),
  ]);

  return {
    instances: instanceEnvelope.instances ?? {},
    catalog,
    tags,
  };
};

type NativeCollectionOutboxPort = Pick<
  typeof nativeCollectionOutbox,
  'list' | 'removeAcknowledged'
>;

type NativeCollectionCachePort = Pick<
  typeof nativeCollectionCache,
  'read' | 'write'
>;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export const getReconciledNativeCollectionSnapshot = async (
  usersClient: Pick<NativeUsersApiClient, 'get'>,
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
  outbox: NativeCollectionOutboxPort,
  cache: NativeCollectionCachePort,
  userId: string,
): Promise<NativeResolvedCollectionSnapshot> => {
  let canonical: NativeCachedCollectionSnapshot;
  let source: NativeResolvedCollectionSnapshot['source'] = 'network';
  let cachedAt: number | null = null;

  try {
    canonical = await getNativeCollectionSnapshot(usersClient, pokemonClient);
    try {
      await cache.write(userId, canonical);
    } catch {
      // A replaceable read cache must never block a successful online collection load.
    }
  } catch (networkError) {
    try {
      const cached = await cache.read(userId);
      if (!cached) throw networkError;
      canonical = cached.snapshot;
      source = 'cache';
      cachedAt = cached.savedAt;
    } catch (cacheError) {
      if (cacheError === networkError) throw networkError;
      throw new Error(
        `Unable to load the collection from the network or this device. Network: ${errorMessage(networkError)} Cache: ${errorMessage(cacheError)}`,
      );
    }
  }

  await reconcileAcknowledgedNativeCollectionBatches({
    userId,
    outbox,
    canonicalInstances: canonical.instances,
  });
  const retained = await outbox.list(userId);
  return {
    ...canonical,
    instances: projectNativeCollectionOutbox(canonical.instances, retained),
    source,
    cachedAt,
  };
};

export const getNativePokemonMoves = (
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
): Promise<PokemonMovesChunk> =>
  pokemonClient.get<PokemonMovesChunk>(pokemonContract.endpoints.moves);

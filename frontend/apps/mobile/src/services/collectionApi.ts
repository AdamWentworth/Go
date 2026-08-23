import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  pokemonContract,
  type BasePokemon,
  type PokemonMovesChunk,
} from '@pokemongonexus/shared-contracts/pokemon';
import {
  usersContract,
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

export type NativeCollectionSnapshot = {
  instances: Record<string, PokemonInstance>;
  catalog: BasePokemon[];
};

export const getNativeCollectionSnapshot = async (
  usersClient: Pick<NativeUsersApiClient, 'get'>,
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
): Promise<NativeCollectionSnapshot> => {
  const [instanceEnvelope, catalog] = await Promise.all([
    usersClient.get<InstanceSyncEnvelope<PokemonInstance>>(
      usersContract.endpoints.instanceSync,
    ),
    pokemonClient.get<BasePokemon[]>(pokemonContract.endpoints.catalog),
  ]);

  return {
    instances: instanceEnvelope.instances ?? {},
    catalog,
  };
};

type NativeCollectionOutboxPort = Pick<
  typeof nativeCollectionOutbox,
  'list' | 'removeAcknowledged'
>;

export const getReconciledNativeCollectionSnapshot = async (
  usersClient: Pick<NativeUsersApiClient, 'get'>,
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
  outbox: NativeCollectionOutboxPort,
  userId: string,
): Promise<NativeCollectionSnapshot> => {
  const canonical = await getNativeCollectionSnapshot(usersClient, pokemonClient);
  await reconcileAcknowledgedNativeCollectionBatches({
    userId,
    outbox,
    canonicalInstances: canonical.instances,
  });
  const retained = await outbox.list(userId);
  return {
    ...canonical,
    instances: projectNativeCollectionOutbox(canonical.instances, retained),
  };
};

export const getNativePokemonMoves = (
  pokemonClient: Pick<NativePokemonApiClient, 'get'>,
): Promise<PokemonMovesChunk> =>
  pokemonClient.get<PokemonMovesChunk>(pokemonContract.endpoints.moves);

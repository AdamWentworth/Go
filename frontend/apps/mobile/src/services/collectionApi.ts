import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  pokemonContract,
  type BasePokemon,
} from '@pokemongonexus/shared-contracts/pokemon';
import {
  usersContract,
  type InstanceSyncEnvelope,
} from '@pokemongonexus/shared-contracts/users';
import type {
  NativePokemonApiClient,
  NativeUsersApiClient,
} from './nativeApiClients';

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

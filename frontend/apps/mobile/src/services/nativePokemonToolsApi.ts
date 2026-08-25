import type {
  BasePokemon,
  PokemonPvPRankingsPayload,
  PokemonRaidDataChunk,
} from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonCommunityRankingsPayload } from '@pokemongonexus/shared-contracts/search';
import { pokemonContract } from '@pokemongonexus/shared-contracts/pokemon';
import { searchContract } from '@pokemongonexus/shared-contracts/search';
import type {
  NativePokemonApiClient,
  NativeSearchApiClient,
} from './nativeApiClients';

export const getNativeToolCatalog = (
  client: Pick<NativePokemonApiClient, 'get'>,
): Promise<BasePokemon[]> => client.get<BasePokemon[]>(pokemonContract.endpoints.catalog);

export const getNativeRaidData = (
  client: Pick<NativePokemonApiClient, 'get'>,
): Promise<PokemonRaidDataChunk> => client.get<PokemonRaidDataChunk>(pokemonContract.endpoints.raidData);

export const getNativeMaxData = (
  client: Pick<NativePokemonApiClient, 'get'>,
): Promise<BasePokemon[]> => client.get<BasePokemon[]>(pokemonContract.endpoints.maxData);

export const getNativePvpData = (
  client: Pick<NativePokemonApiClient, 'get'>,
): Promise<PokemonPvPRankingsPayload> => client.get<PokemonPvPRankingsPayload>(pokemonContract.endpoints.pvpData);

export const getNativeCommunityRankings = (
  client: Pick<NativeSearchApiClient, 'get'>,
  limit = 10_000,
): Promise<PokemonCommunityRankingsPayload> => client.get<PokemonCommunityRankingsPayload>(
  searchContract.endpoints.rankings,
  { query: { limit } },
);

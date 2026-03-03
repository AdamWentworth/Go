import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import {
  usersContract,
  type UserOverview as SharedUserOverview,
} from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export type UserOverview = SharedUserOverview<PokemonInstance, TradeRecord, PokemonInstance, boolean>;

export const fetchUserOverview = async (userId: string): Promise<UserOverview> => {
  const path = usersContract.endpoints.userOverview(userId);
  return requestJson<UserOverview>(
    runtimeConfig.api.usersApiUrl,
    path,
    'GET',
    undefined,
    {
      timeoutMs: 10_000,
      retryCount: 1,
      retryDelayMs: 300,
      credentials: 'include',
    },
  );
};

import { buildUrl } from '@pokemongonexus/shared-contracts/common';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import {
  usersContract,
  type UserOverview as SharedUserOverview,
} from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../config/runtimeConfig';
import { parseJsonSafe } from './httpClient';
import { getAuthToken } from '../features/auth/authSession';

export type UserOverview = SharedUserOverview<PokemonInstance, TradeRecord, PokemonInstance, boolean>;

const buildOverviewUrl = (userId: string): string =>
  buildUrl(runtimeConfig.api.usersApiUrl, usersContract.endpoints.userOverview(userId));

export const fetchUserOverview = async (userId: string): Promise<UserOverview> => {
  const authToken = getAuthToken();
  const response = await fetch(buildOverviewUrl(userId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });
  const data = await parseJsonSafe<UserOverview>(response);

  if (!response.ok || !data) {
    throw new Error(data && typeof data === 'object' ? JSON.stringify(data) : `Request failed (${response.status})`);
  }

  return data;
};

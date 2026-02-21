import { authContract, type LoginResponse } from '@pokemongonexus/shared-contracts/auth';
import {
  usersContract,
  type SecondaryUserUpdateRequest,
} from '@pokemongonexus/shared-contracts/users';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export type UpdateAccountPayload = Partial<
  Pick<LoginResponse, 'pokemonGoName' | 'location' | 'allowLocation' | 'trainerCode'>
>;

export const updateAuthAccount = async (
  userId: string,
  payload: UpdateAccountPayload,
): Promise<Record<string, unknown>> =>
  requestJson<Record<string, unknown>>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.updateUser(userId),
    'PUT',
    payload,
  );

export const updateSecondaryAccount = async (
  userId: string,
  payload: SecondaryUserUpdateRequest,
): Promise<Record<string, unknown>> =>
  requestJson<Record<string, unknown>>(
    runtimeConfig.api.usersApiUrl,
    usersContract.endpoints.updateUser(userId),
    'PUT',
    payload,
  );

export const deleteAccount = async (userId: string): Promise<void> => {
  await requestJson<Record<string, unknown>>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.deleteUser(userId),
    'DELETE',
  );
};


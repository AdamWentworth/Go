import {
  authContract,
  type LoginResponse,
  type RefreshTokenResponse,
} from '@pokemongonexus/shared-contracts/auth';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export type LoginRequest = {
  username: string;
  password: string;
};

export const loginUser = async (payload: LoginRequest): Promise<LoginResponse> =>
  requestJson<LoginResponse>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.login,
    'POST',
    payload,
  );

export const refreshSession = async (): Promise<RefreshTokenResponse> =>
  requestJson<RefreshTokenResponse>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.refresh,
    'POST',
    {},
  );

export const logoutUser = async (): Promise<void> => {
  await requestJson<Record<string, never>>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.logout,
    'POST',
    {},
  );
};

import {
  authContract,
  type AuthRequestPayload,
  type LoginResponse,
  type RefreshTokenResponse,
} from '@pokemongonexus/shared-contracts/auth';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = AuthRequestPayload;

export const registerUser = async (payload: RegisterRequest): Promise<Record<string, unknown>> =>
  requestJson<Record<string, unknown>>(
    runtimeConfig.api.authApiUrl,
    authContract.endpoints.register,
    'POST',
    payload,
  );

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

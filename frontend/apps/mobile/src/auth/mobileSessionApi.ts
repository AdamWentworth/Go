import { createApiClient } from '@pokemongonexus/shared-api-client';
import {
  authContract,
  type ConfirmPasswordResetRequest,
  type MobileLoginRequest,
  type MobileRegisterRequest,
  type MobileSessionResponse,
  type ResetPasswordRequest,
} from '@pokemongonexus/shared-contracts/auth';
import { runtimeConfig } from '../config/runtimeConfig';

export type MobileSessionApi = {
  login: (request: MobileLoginRequest) => Promise<MobileSessionResponse>;
  register: (request: MobileRegisterRequest) => Promise<MobileSessionResponse>;
  refresh: (refreshToken: string) => Promise<MobileSessionResponse>;
  logout: (refreshToken: string) => Promise<void>;
  requestPasswordReset: (request: ResetPasswordRequest) => Promise<void>;
  confirmPasswordReset: (request: ConfirmPasswordResetRequest) => Promise<void>;
};

const validateSession = (value: MobileSessionResponse): MobileSessionResponse => {
  if (!value
      || typeof value.accessToken !== 'string'
      || !value.accessToken
      || typeof value.refreshToken !== 'string'
      || !value.refreshToken
      || typeof value.user?.user_id !== 'string'
      || typeof value.user?.username !== 'string') {
    throw new Error('Authentication service returned an invalid mobile session');
  }
  return value;
};

export const createMobileSessionApi = (
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
): MobileSessionApi => {
  const client = createApiClient({
    baseUrl: runtimeConfig.api.authApiUrl,
    authentication: { mode: 'none' },
    fetch: fetchImplementation,
  });

  return {
    login: async (request) => validateSession(
      await client.post<MobileSessionResponse>(authContract.endpoints.mobileLogin, request),
    ),
    register: async (request) => {
      await client.post(authContract.endpoints.register, request);
      return validateSession(await client.post<MobileSessionResponse>(
        authContract.endpoints.mobileLogin,
        {
          username: request.username,
          password: request.password,
          device_id: request.device_id,
        },
      ));
    },
    refresh: async (refreshToken) => validateSession(
      await client.post<MobileSessionResponse>(authContract.endpoints.mobileRefresh, {
        refreshToken,
      }),
    ),
    logout: async (refreshToken) => {
      await client.post(authContract.endpoints.mobileLogout, { refreshToken });
    },
    requestPasswordReset: async (request) => {
      await client.post(authContract.endpoints.resetPassword, request);
    },
    confirmPasswordReset: async (request) => {
      await client.post(authContract.endpoints.confirmPasswordReset, request);
    },
  };
};

export const mobileSessionApi = createMobileSessionApi();

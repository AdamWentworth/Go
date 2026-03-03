// authService.ts

import { getDeviceId } from '../utils/deviceID';
import { createScopedLogger } from '@/utils/logger';
import {
  buildUrl,
  HttpError,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';
import { removeStorageKeys, STORAGE_KEYS } from '@/utils/storage';
import { authContract } from '@shared-contracts/auth';
import { usersContract } from '@shared-contracts/users';
import type {
  AuthRequestPayload,
  LoginResponse,
  RefreshTokenResponse,
  ResetPasswordRequest,
} from '@shared-contracts/auth';
import type { SecondaryUserUpdateRequest } from '@shared-contracts/users';

const log = createScopedLogger('authService');
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;
const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;

type RequestPayload = AuthRequestPayload | null;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

async function requestJson<T>(
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  payload: RequestPayload = null,
): Promise<T> {
  const response = await requestWithPolicy(buildUrl(baseUrl, path), {
    method,
    headers: JSON_HEADERS,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await parseJsonSafe<T | AuthRequestPayload>(response);

  if (!response.ok) {
    throw toHttpError(response.status, data);
  }

  return (data ?? {}) as T;
}

// ==========================
// registerUser
// ==========================
export const registerUser = async (
  userData: AuthRequestPayload,
): Promise<AuthRequestPayload> => {
  try {
    const deviceId = getDeviceId();
    return await requestJson<AuthRequestPayload>(
      AUTH_API_URL,
      authContract.endpoints.register,
      'POST',
      { ...userData, device_id: deviceId },
    );
  } catch (error: unknown) {
    log.error('Error registering user:', error);
    throw error;
  }
};

// ==========================
// loginUser
// ==========================
export const loginUser = async (
  loginData: AuthRequestPayload,
): Promise<LoginResponse> => {
  try {
    const deviceId = getDeviceId();
    return await requestJson<LoginResponse>(
      AUTH_API_URL,
      authContract.endpoints.login,
      'POST',
      { ...loginData, device_id: deviceId },
    );
  } catch (error: unknown) {
    log.error('Error logging in user:', error);
    throw error;
  }
};

// ==========================
// logoutUser
// ==========================
export const logoutUser = async (): Promise<void> => {
  try {
    await requestJson<unknown>(AUTH_API_URL, authContract.endpoints.logout, 'POST', {});
    removeStorageKeys([
      STORAGE_KEYS.user,
      STORAGE_KEYS.location,
      STORAGE_KEYS.pokemonOwnership,
    ]);
    return Promise.resolve();
  } catch (error: unknown) {
    log.error('Error during logout:', error);
    throw error;
  }
};

// ==========================
// updateUserDetails
// ==========================
export const updateUserDetails = async (
  userId: string,
  userData: AuthRequestPayload
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const data = await requestJson<unknown>(
      AUTH_API_URL,
      authContract.endpoints.updateUser(userId),
      'PUT',
      userData,
    );
    return { success: true, data };
  } catch (error: unknown) {
    log.error('Error updating user:', error);
    if (error instanceof HttpError) {
      return { success: false, error: error.response.data.message };
    }
    return { success: false, error: 'Unknown error' };
  }
};

// ==========================
// updateUserInSecondaryDB
// ==========================
export const updateUserInSecondaryDB = async (
  userId: string,
  userDetails: SecondaryUserUpdateRequest
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const data = await requestJson<unknown>(
      USERS_API_URL,
      usersContract.endpoints.updateUser(userId),
      'PUT',
      {
        username: userDetails.username,
        latitude: userDetails.latitude,
        longitude: userDetails.longitude,
        pokemonGoName: userDetails.pokemonGoName,
      },
    );

    return { success: true, data };
  } catch (error: unknown) {
    log.error('Error updating user in secondary DB:', error);
    if (error instanceof HttpError) {
      return {
        success: false,
        error:
          error.response.data.message ||
          'Failed to update user in secondary DB',
      };
    }
    return { success: false, error: 'Unknown error' };
  }
};

// ==========================
// deleteAccount
// ==========================
export const deleteAccount = async (userId: string): Promise<AuthRequestPayload> => {
  try {
    return await requestJson<AuthRequestPayload>(
      AUTH_API_URL,
      authContract.endpoints.deleteUser(userId),
      'DELETE',
    );
  } catch (error: unknown) {
    log.error('Error deleting account:', error);
    throw error;
  }
};

// ==========================
// refreshTokenService
// ==========================
export const refreshTokenService = async (): Promise<RefreshTokenResponse> => {
  try {
    return await requestJson<RefreshTokenResponse>(
      AUTH_API_URL,
      authContract.endpoints.refresh,
      'POST',
      {},
    );
  } catch (error: unknown) {
    log.error('Error refreshing token:', error);
    throw error;
  }
};

// ==========================
// resetPassword
// ==========================
export const resetPassword = async ({
  identifier,
}: ResetPasswordRequest): Promise<AuthRequestPayload> => {
  try {
    return await requestJson<AuthRequestPayload>(
      AUTH_API_URL,
      authContract.endpoints.resetPassword,
      'POST',
      {
        identifier,
      },
    );
  } catch (error: unknown) {
    log.error('Error resetting password:', error);
    throw error;
  }
};

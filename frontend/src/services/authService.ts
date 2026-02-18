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

const log = createScopedLogger('authService');
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;
const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;

// A generic type for payload objects
interface GenericPayload {
  [key: string]: unknown;
}

type RequestPayload = GenericPayload | null;

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

  const data = await parseJsonSafe<T | GenericPayload>(response);

  if (!response.ok) {
    throw toHttpError(response.status, data);
  }

  return (data ?? {}) as T;
}

// ==========================
// registerUser
// ==========================
export const registerUser = async (userData: GenericPayload): Promise<unknown> => {
  try {
    const deviceId = getDeviceId();
    return await requestJson<unknown>(
      AUTH_API_URL,
      '/register',
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
export const loginUser = async (loginData: GenericPayload): Promise<unknown> => {
  try {
    const deviceId = getDeviceId();
    return await requestJson<unknown>(
      AUTH_API_URL,
      '/login',
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
    await requestJson<unknown>(AUTH_API_URL, '/logout', 'POST', {});
    localStorage.removeItem('user');
    localStorage.removeItem('location');
    localStorage.removeItem('pokemonOwnership');
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
  userData: GenericPayload
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const data = await requestJson<unknown>(
      AUTH_API_URL,
      `/update/${userId}`,
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
interface UserDetails {
  username: string;
  latitude?: number;
  longitude?: number;
  pokemonGoName?: string;
}

export const updateUserInSecondaryDB = async (
  userId: string,
  userDetails: UserDetails
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const data = await requestJson<unknown>(
      USERS_API_URL,
      `/update-user/${userId}`,
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
export const deleteAccount = async (userId: string): Promise<unknown> => {
  try {
    return await requestJson<unknown>(
      AUTH_API_URL,
      `/delete/${userId}`,
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
export const refreshTokenService = async (): Promise<unknown> => {
  try {
    return await requestJson<unknown>(AUTH_API_URL, '/refresh', 'POST', {});
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
}: {
  identifier: string;
}): Promise<unknown> => {
  try {
    return await requestJson<unknown>(AUTH_API_URL, '/reset-password', 'POST', {
      identifier,
    });
  } catch (error: unknown) {
    log.error('Error resetting password:', error);
    throw error;
  }
};

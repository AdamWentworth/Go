// authService.ts

import axios, { AxiosResponse } from 'axios';
import { getDeviceId } from '../utils/deviceID';

axios.defaults.withCredentials = true;

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
});

const readApi = axios.create({
  baseURL: import.meta.env.VITE_USERS_API_URL,
});

// A generic type for payload objects
interface GenericPayload {
  [key: string]: unknown;
}

// ==========================
// registerUser
// ==========================
export const registerUser = async (userData: GenericPayload): Promise<unknown> => {
  try {
    const deviceId = getDeviceId();
    const response: AxiosResponse<unknown> = await authApi.post(
      '/register',
      { ...userData, device_id: deviceId }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error registering user:', error.response || error);
    } else {
      console.error('Error registering user:', error);
    }
    throw error;
  }
};

// ==========================
// loginUser
// ==========================
export const loginUser = async (loginData: GenericPayload): Promise<unknown> => {
  try {
    const deviceId = getDeviceId();
    const response: AxiosResponse<unknown> = await authApi.post(
      '/login',
      { ...loginData, device_id: deviceId }
    );
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error logging in user:', error.response || error);
    } else {
      console.error('Error logging in user:', error);
    }
    throw error;
  }
};

// ==========================
// logoutUser
// ==========================
export const logoutUser = async (): Promise<void> => {
  try {
    await authApi.post('/logout', {});
    localStorage.removeItem('user');
    localStorage.removeItem('location');
    localStorage.removeItem('pokemonOwnership');
    return Promise.resolve();
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error during logout:', error.response || error);
    } else {
      console.error('Error during logout:', error);
    }
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
    const response: AxiosResponse<unknown> = await authApi.put(`/update/${userId}`, userData);
    return { success: true, data: response.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating user:', error.response || error);
      return { success: false, error: (error.response?.data as GenericPayload)?.message as string };
    } else {
      console.error('Error updating user:', error);
      return { success: false, error: 'Unknown error' };
    }
  }
};

// ==========================
// updateUserInSecondaryDB
// ==========================
interface UserDetails {
  username: string;
  latitude?: number;
  longitude?: number;
}

export const updateUserInSecondaryDB = async (
  userId: string,
  userDetails: UserDetails
): Promise<{ success: boolean; data?: unknown; error?: string }> => {
  try {
    const response: AxiosResponse<unknown> = await readApi.put(
      `/update-user/${userId}`,
      {
        username: userDetails.username,
        latitude: userDetails.latitude,
        longitude: userDetails.longitude,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
    return { success: true, data: response.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error updating user in secondary DB:', error.response || error);
      return {
        success: false,
        error: (error.response?.data as GenericPayload)?.message as string ||
          'Failed to update user in secondary DB',
      };
    } else {
      console.error('Error updating user in secondary DB:', error);
      return { success: false, error: 'Unknown error' };
    }
  }
};

// ==========================
// deleteAccount
// ==========================
export const deleteAccount = async (userId: string): Promise<unknown> => {
  try {
    const response: AxiosResponse<unknown> = await authApi.delete(`/delete/${userId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error deleting account:', error.response || error);
    } else {
      console.error('Error deleting account:', error);
    }
    throw error;
  }
};

// ==========================
// refreshTokenService
// ==========================
export const refreshTokenService = async (): Promise<unknown> => {
  try {
    const response: AxiosResponse<unknown> = await authApi.post('/refresh', {});
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error refreshing token:', error.response || error);
    } else {
      console.error('Error refreshing token:', error);
    }
    throw error;
  }
};

// ==========================
// fetchOwnershipData
// ==========================
export const fetchOwnershipData = async (userId: string): Promise<unknown> => {
  try {
    const deviceId = getDeviceId();
    const response: AxiosResponse<unknown> = await readApi.get(`/ownershipData/${userId}`, {
      params: { device_id: deviceId },
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    // response.data now contains { pokemon_instances: { ... }, trades: [ ... ] }
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching ownership data:', error.response || error);
    } else {
      console.error('Error fetching ownership data:', error);
    }
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
    const response: AxiosResponse<unknown> = await authApi.post('/reset-password', { identifier });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error resetting password:', error.response || error);
    } else {
      console.error('Error resetting password:', error);
    }
    throw error;
  }
};

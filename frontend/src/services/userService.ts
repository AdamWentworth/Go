// userService.ts

import axios, { AxiosResponse } from 'axios';
import { getDeviceId } from '../utils/deviceID';
import type { UserOverview } from '@/types/user';

axios.defaults.withCredentials = true;

const readApi = axios.create({
  baseURL: import.meta.env.VITE_USERS_API_URL,
});

// ==========================
// fetchUserOverview
// ==========================
export const fetchUserOverview = async (userId: string): Promise<UserOverview> => {
  try {
    const deviceId = getDeviceId();

    const response: AxiosResponse<UserOverview> = await readApi.get(`/users/${userId}/overview`, {
      params: { device_id: deviceId },
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true, // Ensures cookies/JWT are sent
    });

    // response.data now contains { pokemon_instances: { ... }, trades: [ ... ], ... }
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching user overview:', error.response || error);
    } else {
      console.error('Error fetching user overview:', error);
    }
    throw error;
  }
};

// userService.ts

import { getDeviceId } from '../utils/deviceID';
import { createScopedLogger } from '@/utils/logger';
import type { UserOverview } from '@/types/user';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';
import { usersContract } from '@shared-contracts/users';

const log = createScopedLogger('userService');
const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;

// ==========================
// fetchUserOverview
// ==========================
export const fetchUserOverview = async (userId: string): Promise<UserOverview> => {
  try {
    const deviceId = getDeviceId();
    const url = buildUrl(USERS_API_URL, usersContract.endpoints.userOverview(userId), {
      device_id: deviceId,
    });

    const response = await requestWithPolicy(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await parseJsonSafe<UserOverview>(response);

    if (!response.ok || !data) {
      throw toHttpError(response.status, data);
    }

    return data;
  } catch (error: unknown) {
    log.error('Error fetching user overview:', error);
    throw error;
  }
};

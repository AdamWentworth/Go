// services/sseService.ts

import axios from 'axios';

export const fetchUpdates = async (
  userId: string,
  deviceId: string,
  timestamp: string
): Promise<unknown | null> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_EVENTS_API_URL}/getUpdates`, {
      params: {
        device_id: deviceId,
        timestamp: timestamp,
      },
      withCredentials: true,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Failed to fetch updates.');
      return null;
    }
  } catch {
    console.error('Failed to fetch updates.');
    return null;
  }
};

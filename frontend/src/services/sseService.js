// services/sseService.js

import axios from 'axios';

export const fetchUpdates = async (userId, deviceId, timestamp) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_EVENTS_API_URL}/getUpdates`, {
      params: {
        device_id: deviceId,
        timestamp: timestamp,
      },
      withCredentials: true,
      validateStatus: (status) => {
        return true;
      },
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.log('Failed to fetch updates.');
      return null;
    }
  } catch (error) {
    console.log('Failed to fetch updates.');
    return null;
  }
};

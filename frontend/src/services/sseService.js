// sseService.js

import { getDeviceId } from '../utils/deviceID';
import axios from 'axios'; // Import axios for making HTTP requests
import { readTimestampFromCache } from '../utils/cacheHelpers'; // We'll create this helper function

let eventSource = null;
let isReconnecting = false; // Keep track of reconnection state

export const initiateSSEConnection = (userId, handleIncomingUpdate) => {
  if (!userId) {
    console.warn('No userId provided, cannot initiate SSE connection.');
    return;
  }

  // Close any existing connection
  if (eventSource) {
    eventSource.close();
  }

  const deviceId = getDeviceId();
  const sseUrl = `${process.env.REACT_APP_EVENTS_API_URL}/sse?device_id=${deviceId}`;
  console.log('Attempting to initiate SSE connection to:', sseUrl);

  try {
    eventSource = new EventSource(sseUrl, { withCredentials: true });
    console.log('EventSource created:', eventSource);

    eventSource.onopen = async () => {
      console.log('SSE connection opened.');
      if (isReconnecting) {
        console.log('Reconnected to SSE stream.');
        // Fetch updates upon reconnection
        try {
          const timestamp = await readTimestampFromCache(); // Get timestamp from cache
          if (timestamp) {
            const updates = await fetchUpdates(userId, deviceId, timestamp);
            console.log('Fetched updates upon reconnection:', updates);
            handleIncomingUpdate(updates);
          } else {
            console.warn('No timestamp found in cache, unable to fetch updates.');
          }
        } catch (error) {
          console.error('Error fetching updates upon reconnection:', error);
        }
        isReconnecting = false; // Reset reconnection state
      }
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received SSE message:', data);
      handleIncomingUpdate(data);
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      // Implement reconnection logic
      isReconnecting = true;
      // Retry connection after a delay
      setTimeout(() => {
        initiateSSEConnection(userId, handleIncomingUpdate);
      }, 5000);
    };
  } catch (error) {
    console.error('Error creating EventSource:', error);
  }
};

export const closeSSEConnection = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.log('SSE connection closed.');
  }
};

// Helper function to fetch updates from the new endpoint
const fetchUpdates = async (userId, deviceId, timestamp) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_EVENTS_API_URL}/getUpdates`, {
      params: {
        device_id: deviceId,
        timestamp: timestamp,
      },
      withCredentials: true, // Include credentials in the request
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching updates:', error);
    throw error;
  }
};

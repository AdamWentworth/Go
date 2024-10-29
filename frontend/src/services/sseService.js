// sseService.js

import { getDeviceId } from '../utils/deviceID';
import axios from 'axios';

let eventSource = null;
let isReconnecting = false; // Keep track of reconnection state

export const initiateSSEConnection = (userId, handleIncomingUpdate, lastUpdateTimestamp) => {
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
    // Instantiate the EventSource
    eventSource = new EventSource(sseUrl, { withCredentials: true });
    console.log('EventSource created:', eventSource);

    eventSource.onopen = async () => {
      console.log('SSE connection opened.');
      if (isReconnecting) {
        console.log('Reconnected to SSE stream.');

        // Fetch updates upon reconnection
        if (lastUpdateTimestamp) {
          console.log('Fetching missed updates upon reconnection...');
          try {
            const updates = await fetchUpdates(userId, deviceId, lastUpdateTimestamp.toISOString());
            console.log('Fetched updates upon reconnection:', updates);
            if (updates && updates.pokemon && updates.pokemon.length > 0) {
              console.log('Missed updates received upon reconnection:', updates.pokemon.length);
              handleIncomingUpdate(updates);
            } else {
              console.log('No missed updates found upon reconnection.');
            }
          } catch (error) {
            console.error('Error fetching updates upon reconnection:', error);
          }
        } else {
          console.warn('No timestamp found, unable to fetch updates upon reconnection.');
        }
        isReconnecting = false;
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
        initiateSSEConnection(userId, handleIncomingUpdate, lastUpdateTimestamp);
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

// Helper function to fetch updates
export const fetchUpdates = async (userId, deviceId, timestamp) => {
  try {
    console.log('Calling fetchUpdates with:', {
      userId,
      deviceId,
      timestamp,
    });
    const response = await axios.get(`${process.env.REACT_APP_EVENTS_API_URL}/getUpdates`, {
      params: {
        device_id: deviceId,
        timestamp: timestamp,
      },
      withCredentials: true,
    });
    console.log('fetchUpdates response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching updates:', error);
    throw error;
  }
};

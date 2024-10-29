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
    console.log('EventSource created.');

    eventSource.onopen = async () => {
      console.log('SSE connection opened.');
      if (isReconnecting) {
        isReconnecting = false; // Reset reconnection flag
    
        // Fetch updates upon reconnection
        if (lastUpdateTimestamp) {
          // Convert lastUpdateTimestamp to milliseconds since epoch
          const timestamp = lastUpdateTimestamp.getTime().toString();
    
          try {
            const updates = await fetchUpdates(userId, deviceId, timestamp);
            if (updates && updates.pokemon && Object.keys(updates.pokemon).length > 0) {
              handleIncomingUpdate(updates);
            } else {
              console.log('No missed updates found upon reconnection.');
            }
          } catch (error) {
            console.log('Failed to fetch updates upon reconnection.');
            // Do not log the full error to keep console clean
          }
        }
      } else {
        console.log('Initial SSE connection established.');
      }
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleIncomingUpdate(data);
    };

    eventSource.onerror = () => {
      if (!isReconnecting) {
        isReconnecting = true;
        console.log('Connection failed. Will attempt to reconnect in 30 seconds.');
        // Attempt to reconnect after 30 seconds
        setTimeout(() => {
          initiateSSEConnection(userId, handleIncomingUpdate, lastUpdateTimestamp);
        }, 30000);
      }
    };
  } catch (error) {
    console.log('Failed to create SSE connection.');
    // Do not log the full error to keep console clean
  }
};

export const closeSSEConnection = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
};

// Helper function to fetch updates
export const fetchUpdates = async (userId, deviceId, timestamp) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_EVENTS_API_URL}/getUpdates`, {
      params: {
        device_id: deviceId,
        timestamp: timestamp,
      },
      withCredentials: true,
      validateStatus: (status) => {
        // Accept any status code to prevent Axios from throwing
        return true;
      },
    });
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      // Handle non-2xx responses
      console.log('Failed to fetch updates.');
      return null;
    }
  } catch (error) {
    // Suppress Axios error logs
    console.log('Failed to fetch updates.');
    return null;
  }
};

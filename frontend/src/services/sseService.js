// sseService.js

import { getDeviceId } from '../utils/deviceID';

let eventSource = null;

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

    eventSource.onopen = () => {
        console.log('SSE connection opened.');
      };
      
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received SSE message:', data);
        handleIncomingUpdate(data);
    };
      
    eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        // Implement reconnection logic if needed
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

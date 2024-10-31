// contexts/Auth/sseHandler.js

import { useEffect, useRef } from 'react';
import { getDeviceId } from '../../utils/deviceID';
import { fetchUpdates } from '../../services/sseService'; // We'll adjust sseService.js accordingly

export const useSSEHandler = (
  user,
  isLoading,
  isSessionReady,
  isSessionNew,
  lastUpdateTimestamp,
  handleIncomingUpdate,
  updateTimestamp
) => {
  const eventSourceRef = useRef(null);
  const hasConnectedRef = useRef(false);
  const deviceIdRef = useRef(null);

  useEffect(() => {
    // console.log('useEffect triggered in useSSEHandler');
    // console.log('hasConnectedRef.current:', hasConnectedRef.current);
    if (user && !isLoading && isSessionReady && !hasConnectedRef.current) {
      hasConnectedRef.current = true; // Move this line to the top

      const deviceId = deviceIdRef.current || (deviceIdRef.current = getDeviceId());

      if (isSessionNew && lastUpdateTimestamp) {
        console.log('Fetching missed updates...');

        const timestamp = lastUpdateTimestamp.getTime().toString();

        fetchUpdates(user.user_id, deviceId, timestamp)
          .then((updates) => {
            if (updates && updates.pokemon && Object.keys(updates.pokemon).length > 0) {
              handleIncomingUpdate(updates);
            } else {
              console.log('No missed updates found.');
              const newTimestamp = new Date();
              updateTimestamp(newTimestamp);
            }
          })
          .catch((error) => {
            console.log('Failed to fetch missed updates.');
          });
      } else {
        console.log('Session is not new or lastUpdateTimestamp is null, not fetching missed updates.');
      }

      // Initiate SSE connection
      initiateSSEConnection(user.user_id, handleIncomingUpdate, lastUpdateTimestamp);
    }

    return () => {
      // Clean up if the component unmounts or dependencies change
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        hasConnectedRef.current = false;
      }
    };
  }, [user, isLoading, isSessionReady]);

  const initiateSSEConnection = (userId, handleIncomingUpdate, lastUpdateTimestamp) => {
    const deviceId = deviceIdRef.current;

    const sseUrl = `${process.env.REACT_APP_EVENTS_API_URL}/sse?device_id=${deviceId}`;
    console.log('Attempting to initiate SSE connection to:', sseUrl);

    try {
      // Instantiate the EventSource
      const eventSource = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = eventSource;
      console.log('EventSource created.');

      eventSource.onopen = async () => {
        console.log('SSE connection opened.');
        console.log('Initial SSE connection established.');
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleIncomingUpdate(data);
      };

      eventSource.onerror = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          hasConnectedRef.current = false;
        }
        console.log('Connection failed. Will attempt to reconnect in 30 seconds.');
        // Attempt to reconnect after 30 seconds
        setTimeout(() => {
          initiateSSEConnection(userId, handleIncomingUpdate, lastUpdateTimestamp);
        }, 30000);
      };
    } catch (error) {
      console.log('Failed to create SSE connection.');
    }
  };

  return {
    closeConnection: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        hasConnectedRef.current = false;
      }
    },
  };
};

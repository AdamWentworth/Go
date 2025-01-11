// EventsContext.js

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useCallback
  } from 'react';
  import { useAuth } from './AuthContext';
  import { usePokemonData } from './PokemonDataContext'; // <-- Import to check loading state
  import { useSession } from './SessionContext';
  import { fetchUpdates } from '../services/sseService';
  import { getDeviceId } from '../utils/deviceID';
  import { useTradeData } from './TradeDataContext'
  
  // 1) Create the context & custom hook
  const EventsContext = createContext();
  export const useEvents = () => useContext(EventsContext);
  
  // 2) Provider that wraps SSE logic
  export const EventsProvider = ({ children }) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    // From PokemonDataContext, we can read the 'loading' state
    const { loading: isPokemonDataLoading, setOwnershipData } = usePokemonData();
    const { trades, relatedInstances, setTradeData, setRelatedInstances } = useTradeData();
    const { lastUpdateTimestamp, updateTimestamp, isSessionNew } = useSession();
  
    const deviceIdRef = useRef(getDeviceId());
    const sseRef = useRef(null);
  
    // Tracks whether we've already run the SSE init on this page load
    const hasInitializedRef = useRef(false);
  
    // -- 3) Handle SSE data merges
    const handleIncomingUpdate = useCallback(
      (data) => {
        console.log('handleIncomingUpdate called with data:', data);
        if (data.pokemon) {
          // Merge into our local ownership data
          setOwnershipData(data.pokemon);
  
          // Update the last update timestamp to "now"
          updateTimestamp(new Date());
        }
        if (data.trade) {
          // Update the trades collection with the modified trade(s)
          const updatedTrades = {
              ...trades,
              ...data.trade
          };
      
          setTradeData(updatedTrades);
        }
        if (data.relatedInstance) {
          // Update the trades collection with the modified trade(s)
          const updatedRelatedInstances = {
              ...relatedInstances,
              ...data.relatedInstance
          };
      
          setRelatedInstances(updatedRelatedInstances);
        }
      },
      [setOwnershipData, updateTimestamp]
    );
  
    // -- 4) Close any existing SSE connection
    const closeSSEConnection = useCallback(() => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
        console.log('SSE connection closed.');
      }
    }, []);
  
    // -- 5) Initiate a new SSE connection
    const initiateSSEConnection = useCallback(() => {
      if (!user) return; // Must have a user in order to open SSE
  
      // Close any existing SSE first
      closeSSEConnection();
  
      // Construct the SSE URL
      const deviceId = deviceIdRef.current;
      const sseUrl = `${process.env.REACT_APP_EVENTS_API_URL}/sse?device_id=${deviceId}`;
  
      try {
        const eventSource = new EventSource(sseUrl, { withCredentials: true });
        sseRef.current = eventSource;
  
        eventSource.onopen = () => {
          console.log('SSE connection opened.');
        };
  
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleIncomingUpdate(data);
        };
  
        eventSource.onerror = (error) => {
          console.error('SSE connection encountered an error, closing...', error);
          eventSource.close();
          sseRef.current = null;
        };
      } catch (error) {
        console.error('Failed to create SSE connection:', error);
      }
    }, [closeSSEConnection, handleIncomingUpdate, user]);
  
    // -- 6) On mount/update: If user & session are ready, data is loaded, fetch missed updates, then open SSE
    useEffect(() => {
      // If we've already initialized SSE once, skip
      if (hasInitializedRef.current) {
        return;
      }
  
      // Only proceed if:
      // - user is present
      // - Auth isn't loading
      // - Pokemon data has finished loading from cache
      // - lastUpdateTimestamp is not null
      if (
        user &&
        !isAuthLoading &&
        !isPokemonDataLoading &&
        lastUpdateTimestamp !== null
      ) {
        if (isSessionNew) {
          // If the session is new, fetch "missed updates"
          console.log('Fetching missed updates...');
          const deviceId = deviceIdRef.current;
          const timestamp = lastUpdateTimestamp.getTime().toString();
  
          fetchUpdates(user.user_id, deviceId, timestamp)
            .then((updates) => {
              if (
                updates &&
                updates.pokemon &&
                Object.keys(updates.pokemon).length > 0
              ) {
                handleIncomingUpdate(updates);
              } else {
                console.log('No missed updates found.');
                updateTimestamp(new Date());
              }
            })
            .catch((error) => {
              console.log('Failed to fetch missed updates:', error);
            })
            .finally(() => {
              console.log('Attempting to establish SSE connection...');
              initiateSSEConnection();
              // Mark SSE as initialized so we don't run this block again
              hasInitializedRef.current = true;
            });
        } else {
          console.log(
            'Session is not new or lastUpdateTimestamp is null, not fetching missed updates.'
          );
          console.log('Attempting to establish SSE connection...');
          initiateSSEConnection();
          // Mark SSE as initialized
          hasInitializedRef.current = true;
        }
      }
    }, [
      user,
      isAuthLoading,
      isPokemonDataLoading,
      lastUpdateTimestamp,
      isSessionNew,
      initiateSSEConnection,
      handleIncomingUpdate,
      updateTimestamp
    ]);
  
    // -- 7) Reconnect logic if SSE drops
    useEffect(() => {
      const reconnectInterval = setInterval(() => {
        // If user is still logged in, session is ready, data is loaded, but no SSE connection
        if (
          user &&
          !isAuthLoading &&
          !isPokemonDataLoading &&
          lastUpdateTimestamp !== null &&
          !sseRef.current
        ) {
          console.log('No active SSE connection, attempting to reconnect...');
          initiateSSEConnection();
        }
      }, 30000); // check every 30 seconds
  
      return () => {
        clearInterval(reconnectInterval);
      };
    }, [
      user,
      isAuthLoading,
      isPokemonDataLoading,
      lastUpdateTimestamp,
      initiateSSEConnection
    ]);
  
    // -- 8) Cleanup on unmount
    useEffect(() => {
      return () => {
        closeSSEConnection();
      };
    }, [closeSSEConnection]);
  
    // -- 9) Provide any SSE-related state or methods if needed
    return (
      <EventsContext.Provider value={{}}>
        {children}
      </EventsContext.Provider>
    );
  };
  
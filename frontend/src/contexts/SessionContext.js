// SessionContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext();

export const useSession = () => React.useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);
  const [isSessionNew, setIsSessionNew] = useState(false);

  const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const initializeSession = () => {
      const currentTime = new Date().getTime();
      const lastActivityTimeStr = localStorage.getItem('lastActivityTime');
      let lastActivityTime = null;
      if (lastActivityTimeStr) {
        lastActivityTime = parseInt(lastActivityTimeStr, 10);
      }

      if (lastActivityTime) {
        const timeSinceLastActivity = currentTime - lastActivityTime;
        if (timeSinceLastActivity > INACTIVITY_THRESHOLD_MS) {
          // Consider this as a new session
          setIsSessionNew(true);
        } else {
          setIsSessionNew(false);
        }
      } else {
        // No previous activity time, consider it a new session
        setIsSessionNew(true);
      }

      // Update lastActivityTime to current time
      localStorage.setItem('lastActivityTime', currentTime.toString());

      // Initialize lastUpdateTimestamp
      const storedData = localStorage.getItem('pokemonOwnership');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData.timestamp) {
            const timestamp = new Date(parsedData.timestamp);
            console.log('Initialized lastUpdateTimestamp from localStorage:', timestamp);
            setLastUpdateTimestamp(timestamp);
          } else {
            console.log('No timestamp found in stored data, initializing to current time');
            setLastUpdateTimestamp(new Date());
          }
        } catch (error) {
          console.error('Error parsing pokemonOwnership from localStorage:', error);
          setLastUpdateTimestamp(new Date());
        }
      } else {
        console.log('No pokemonOwnership data found in localStorage, initializing to current time');
        setLastUpdateTimestamp(new Date());
      }
    };

    initializeSession();

    // Update lastActivityTime whenever the app gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentTime = new Date().getTime();
        localStorage.setItem('lastActivityTime', currentTime.toString());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateTimestamp = useCallback((timestamp) => {
    console.log('Updating lastUpdateTimestamp to:', timestamp);
    setLastUpdateTimestamp(timestamp);
    // Since we've received updates, the session is no longer new
    setIsSessionNew(false);
    console.log('Session is no longer new');
  }, []);

  return (
    <SessionContext.Provider value={{ lastUpdateTimestamp, updateTimestamp, isSessionNew }}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;

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
      let lastActivityTime = lastActivityTimeStr ? parseInt(lastActivityTimeStr, 10) : null;

      if (lastActivityTime) {
        const timeSinceLastActivity = currentTime - lastActivityTime;
        setIsSessionNew(timeSinceLastActivity > INACTIVITY_THRESHOLD_MS);
      } else {
        setIsSessionNew(true);
      }

      // Update lastActivityTime
      localStorage.setItem('lastActivityTime', currentTime.toString());

      // Initialize lastUpdateTimestamp using ownershipTimestamp
      const ownershipTimestamp = localStorage.getItem('ownershipTimestamp');
      if (ownershipTimestamp) {
        const timestamp = new Date(parseInt(ownershipTimestamp, 10));
        console.log('Initialized lastUpdateTimestamp from localStorage:', timestamp);
        setLastUpdateTimestamp(timestamp);
      } else {
        console.log('No ownershipTimestamp found in localStorage, initializing to current time');
        setLastUpdateTimestamp(new Date());
      }
    };

    initializeSession();

    // Update lastActivityTime when the app gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem('lastActivityTime', new Date().getTime().toString());
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
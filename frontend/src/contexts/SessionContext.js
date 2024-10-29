// SessionContext.js

import React, { createContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const useSession = () => React.useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);
  const [isSessionNew, setIsSessionNew] = useState(true);

  useEffect(() => {
    // console.log('SessionContext useEffect triggered for initialization');
    const initializeTimestamp = () => {
      const storedData = localStorage.getItem('pokemonOwnership');
    //   console.log('Stored pokemonOwnership data:', storedData);
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
    initializeTimestamp();
  }, []);

  const updateTimestamp = (timestamp) => {
    console.log('Updating lastUpdateTimestamp to:', timestamp);
    setLastUpdateTimestamp(timestamp);
    // Since we've received updates, the session is no longer new
    setIsSessionNew(false);
    console.log('Session is no longer new');
  };

  return (
    <SessionContext.Provider value={{ lastUpdateTimestamp, updateTimestamp, isSessionNew }}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;

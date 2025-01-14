// PokemonDataContext.js

import React, {
  useContext,
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { initializePokemonLists } from './PokemonData/PokemonTradeListOperations';
import { fetchData } from './PokemonData/fetchData';
import { updateOwnership as importedUpdateOwnership } from './PokemonData/updateOwnership';
import { updateLists as importedUpdateLists } from './PokemonData/updateLists';
import { updateDetails as importedUpdateDetails } from './PokemonData/updateDetails';
import { mergeOwnershipData as importedMergeOwnershipData } from './PokemonData/mergeOwnershipData';
import { periodicUpdates as importedPeriodicUpdates } from './BatchedUpdates/periodicUpdates';
import { checkBatchedUpdates as importedCheckBatchedUpdates } from './BatchedUpdates/checkBatchedUpdates';

import { useGlobalState } from './GlobalStateContext';

const PokemonDataContext = createContext();
export const usePokemonData = () => useContext(PokemonDataContext);

export const PokemonDataProvider = ({ children }) => {
  const [data, setData] = useState({
    variants: [],
    ownershipData: {},
    lists: {},
    loading: true
  });

  const ownershipDataRef = useRef(data.ownershipData);
  const { isLoggedIn } = useGlobalState();

  // These are the shared refs for scheduling
  const scheduledSyncRef = useRef(null);
  const timerRef = useRef(null);

  // Wrap the importedPeriodicUpdates in useCallback
  const periodicUpdates = useCallback(
    importedPeriodicUpdates(scheduledSyncRef, timerRef),
    []
  );

  useEffect(() => {
    if (data.loading) {
      console.time('fetchData Duration');
      fetchData(setData, updateOwnership, updateLists)
        .then(() => {
          console.timeEnd('fetchData Duration');
        })
        .catch(error => {
          console.error('Failed to load Pokemon data:', error);
          setData(prev => ({ ...prev, loading: false }));
          console.timeEnd('fetchData Duration');
        });
    }
  }, [data.loading]);

  const updateLists = useCallback(importedUpdateLists(data, setData), [
    data.ownershipData,
    data.variants
  ]);

  const ownershipTimestamp = useMemo(() => {
    return parseInt(localStorage.getItem('ownershipTimestamp'), 10) || 0;
  }, [data.ownershipData]);

  const listsTimestamp = useMemo(() => {
    return parseInt(localStorage.getItem('listsTimestamp'), 10) || 0;
  }, [data.lists]);

  useEffect(() => {
    if (!data.loading && ownershipTimestamp > listsTimestamp) {
      updateLists();
    }
  }, [data.loading, ownershipTimestamp, listsTimestamp, updateLists]);

  useEffect(() => {
    if (isLoggedIn) {
      importedCheckBatchedUpdates(periodicUpdates);
    }
  }, [isLoggedIn, periodicUpdates]);

  // Refactored updateOwnership to be async and await the ownership update
  const updateOwnership = useCallback(
    async (...args) => {
      await importedUpdateOwnership(data, setData, ownershipDataRef, data.lists)(...args);
      if (isLoggedIn) {
        periodicUpdates();
      }
    },
    [data, isLoggedIn, periodicUpdates]
  );

  const updateDetails = useCallback(
    async (...args) => {
      await importedUpdateDetails(data, setData, updateLists)(...args);
      if (isLoggedIn) {
        periodicUpdates();
      }
    },
    [data.ownershipData, updateLists, isLoggedIn, periodicUpdates]
  );

  useEffect(() => {
    ownershipDataRef.current = data.ownershipData;
  }, [data.ownershipData]);

  const resetData = () => {
    setData({
      variants: [],
      ownershipData: {},
      lists: {},
      loading: true
    });
  };

  const setOwnershipData = (newOwnershipData) => {
    // Check if newOwnershipData is empty. Adjust conditions based on your data type.
    if (!newOwnershipData || Object.keys(newOwnershipData).length === 0) {
      console.log("No newOwnershipData provided. Skipping merge and returning oldData.");
      // console.log(ownershipDataRef.current)
      return;
  }
  
    // Retrieve the user data from local storage
    const userData = localStorage.getItem('user');
  
    // Parse the user data (if it exists) and extract the username
    let username = null;
    if (userData) {
      const parsedData = JSON.parse(userData);
      username = parsedData.username;
    }
  
    // console.log(ownershipDataRef.current);
  
    // 1. Merge data up-front
    const updatedOwnershipData = importedMergeOwnershipData(
      ownershipDataRef.current,   // current data/props/state
      newOwnershipData,
      username
    );
  
    // 2. Keep a ref copy or do other synchronous steps
    ownershipDataRef.current = updatedOwnershipData; 
    const currentTimestamp = Date.now();
    localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());
  
    // 3. Update state with the *already merged* data
    setData(prevData => ({
      ...prevData,
      ownershipData: updatedOwnershipData,
      lists: initializePokemonLists(updatedOwnershipData, prevData.variants),
    }));
  
    // 4. Post message to SW with the *same* merged data
    navigator.serviceWorker.ready
      .then((registration) => {
        const sw = navigator.serviceWorker.controller || registration.active;
        if (sw) {
          sw.postMessage({
            action: 'syncData',
            data: { data: updatedOwnershipData, timestamp: currentTimestamp },
          });
        } else {
          console.warn('No active service worker found');
        }
      })
      .catch((err) => console.error('SW readiness error:', err));
  };  

  // Make sure we provide `periodicUpdates` so others can call it
  const contextValue = useMemo(() => ({
    ...data,
    updateOwnership,
    updateLists,
    updateDetails,
    setOwnershipData,
    resetData,
    periodicUpdates // <- Expose it here
  }), [
    data,
    updateOwnership,
    updateDetails,
    periodicUpdates
  ]);

  return (
    <PokemonDataContext.Provider value={contextValue}>
      {children}
    </PokemonDataContext.Provider>
  );
};

export { PokemonDataContext };

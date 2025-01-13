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
    setData(prevData => {
      const updatedOwnershipData = importedMergeOwnershipData(
        prevData.ownershipData,
        newOwnershipData
      );
      ownershipDataRef.current = updatedOwnershipData;

      const currentTimestamp = Date.now();
      localStorage.setItem(
        'pokemonOwnership',
        JSON.stringify({ data: updatedOwnershipData, timestamp: Date.now() })
      );
      localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

      return {
        ...prevData,
        ownershipData: updatedOwnershipData,
        lists: initializePokemonLists(updatedOwnershipData, prevData.variants)
      };
    });

    navigator.serviceWorker.ready.then(registration => {
      const sw = navigator.serviceWorker.controller || registration.active;
      console.log('Service Worker to send message to:', sw);
      if (sw) {
        sw.postMessage({
          action: 'syncData',
          data: { data: ownershipDataRef.current, timestamp: Date.now() }
        });
      } else {
        console.warn('No active service worker found');
      }
    }).catch(err => console.error('SW readiness error:', err));
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

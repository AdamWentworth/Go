// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { updatePokemonDetails } from '../components/Collect/PokemonOwnership/pokemonOwnershipManager';
import { initializePokemonLists, updatePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';

import { fetchData } from './PokemonData/fetchData';
import { updateOwnership as importedUpdateOwnership } from './PokemonData/updateOwnership';
import { updateLists as importedUpdateLists } from './PokemonData/updateLists';

// Create a React context for sharing Pokemon data across components
const PokemonDataContext = createContext();

// Custom hook to use the context
export const usePokemonData = () => useContext(PokemonDataContext);

// Context provider component that wraps around children components
export const PokemonDataProvider = ({ children }) => {
    // State to hold all Pokemon data and loading status
    const [data, setData] = useState({
        variants: [],
        ownershipData: {},
        lists: {},
        loading: true
    });

    // State to track the login status and sync scheduling independently
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInitialSyncScheduled, setIsInitialSyncScheduled] = useState(false);

    // Ref to always hold the latest ownershipData
    const ownershipDataRef = useRef(data.ownershipData);

    // Function to load isLoggedIn and isInitialSyncScheduled states from cache
    const loadStateFromCache = useCallback(async () => {
        console.log('Loading isLoggedIn and isInitialSyncScheduled state from cache...');
        const cache = await caches.open('stateCache');
        const response = await cache.match('state');
        if (response) {
            const state = await response.json();
            console.log('Loaded state from cache:', state);
            setIsLoggedIn(state.isLoggedIn);
            setIsInitialSyncScheduled(state.isInitialSyncScheduled);
        } else {
            console.log('No isLoggedIn or isInitialSyncScheduled state found in cache.');
        }
    }, []);

    // Function to save isLoggedIn and isInitialSyncScheduled states to cache
    const saveStateToCache = useCallback(async () => {
        const state = {
            isLoggedIn,
            isInitialSyncScheduled,
        };
        const cache = await caches.open('stateCache');
        const response = new Response(JSON.stringify(state), {
            headers: { 'Content-Type': 'application/json' },
        });
        await cache.put('state', response);
        console.log('State saved to cache:', state);
    }, [isLoggedIn, isInitialSyncScheduled]);

    // Effect to load the initial states from cache
    useEffect(() => {
        loadStateFromCache();
    }, [loadStateFromCache]);

    // Function to update the isLoggedIn state and save to cache
    const updateIsLoggedIn = useCallback((loggedIn) => {
        console.log('Updating isLoggedIn state:', loggedIn);
        setIsLoggedIn(loggedIn);
        saveStateToCache(); // Save state to cache after updating
    }, [saveStateToCache]);

    // Function to handle the initial sync scheduling
    const scheduleInitialSync = useCallback(() => {
        if (isInitialSyncScheduled || !isLoggedIn) return;
        console.log(`[${new Date().toLocaleTimeString()}] Starting immediate sync followed by periodic interval`);
        setIsInitialSyncScheduled(true);
        saveStateToCache(); // Save state to cache after scheduling initial sync
    }, [isInitialSyncScheduled, isLoggedIn, saveStateToCache]);

    // Effect to check if an initial sync needs to be scheduled when the user logs in
    useEffect(() => {
        if (isLoggedIn && !isInitialSyncScheduled) {
            scheduleInitialSync();
        }
    }, [isLoggedIn, isInitialSyncScheduled, scheduleInitialSync]);

    // Effect to fetch data on component mount
    useEffect(() => {
        if (data.loading) {
            fetchData(setData, ownershipDataRef, updateOwnership, updateLists).catch(error => {
                console.error("Failed to load Pokemon data:", error);
                setData(prev => ({ ...prev, loading: false }));
            });
        }
    }, [data.loading]);    

    // Function to update Pokemon lists
    const updateLists = useCallback(importedUpdateLists(data, setData), [data.ownershipData, data.variants]);

    // Function to update ownership status
    const updateOwnership = useCallback(importedUpdateOwnership(data, setData, ownershipDataRef, updateLists), [data.variants, updateLists]);

    // Function to update Instance details
    const updateDetails = useCallback((pokemonKey, details) => {
        updatePokemonDetails(pokemonKey, details, data.ownershipData);

        // Assuming the update is successful, we update the context state
        const newData = { ...data.ownershipData };
        const currentTimestamp = Date.now();
        newData[pokemonKey] = { ...newData[pokemonKey], ...details, last_update: currentTimestamp };

        setData(prevData => ({
            ...prevData,
            ownershipData: newData
        }));

        navigator.serviceWorker.ready.then(async registration => {
            registration.active.postMessage({
                action: 'syncData',
                data: { data: newData, timestamp: Date.now() }
            });

            const cache = await caches.open('pokemonCache');
            const cachedUpdates = await cache.match('/batchedUpdates');
            let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

            updatesData[pokemonKey] = newData[pokemonKey];

            await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
                headers: { 'Content-Type': 'application/json' }
            }));

            // Trigger the service worker to schedule sync
            registration.active.postMessage({
                action: 'scheduleSync'
            });

            // Now call updateLists after syncData is complete
            updateLists();
        });
    }, [data.ownershipData, updateLists]);

    function mergeOwnershipData(oldData, newData) {
        const mergedData = {};
        const oldDataProcessed = {};
    
        const extractPrefix = (key) => {
            const keyParts = key.split('_');
            keyParts.pop(); // Remove the UUID part
            return keyParts.join('_'); // Rejoin to form the actual prefix
        };
    
        console.log("Starting merge process...");
    
        // Merge new data
        Object.keys(newData).forEach(key => {
            const prefix = extractPrefix(key);
            // Check for exact key match in old and new data
            if (oldData.hasOwnProperty(key)) {
                // If matching keys, compare their last_update values
                const newDate = new Date(newData[key].last_update);
                const oldDate = new Date(oldData[key].last_update);
                if (newDate > oldDate) {
                    mergedData[key] = newData[key];
                } else {
                    mergedData[key] = oldData[key];
                }
                // console.log(`Merging based on latest update for key: ${key}`);
            } else {
                mergedData[key] = newData[key];
            }
            oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
            oldDataProcessed[prefix].push(key);
            // console.log(`Processed new key: ${key} with prefix: ${prefix}`);
        });
    
        // Merge old data
        Object.keys(oldData).forEach(oldKey => {
            const prefix = extractPrefix(oldKey);
            if (!oldDataProcessed[prefix]) {
                // No new data with this prefix, add old data as is
                mergedData[oldKey] = oldData[oldKey];
            } else {
                const significantOld = oldData[oldKey].is_owned || oldData[oldKey].is_for_trade || oldData[oldKey].is_wanted;
                const anySignificantNew = oldDataProcessed[prefix].some(newKey =>
                    newData[newKey].is_owned || newData[newKey].is_for_trade || newData[newKey].is_wanted);
    
                if (significantOld && !anySignificantNew) {
                    // Old data is significant and no new significant data, retain old
                    mergedData[oldKey] = oldData[oldKey];
                    // console.log(`Retaining significant old data for key: ${oldKey}`);
                } else {
                    // New significant data found, already handled by timestamp comparison or adding new data
                    // console.log(`New significant data found or updated for prefix: ${prefix}. Not duplicating entry for key: ${oldKey}`);
                }
            }
        });
    
        // Ensure at most one instance per prefix has is_unowned: true
        const finalData = {};
        const unownedTracker = new Set();
    
        Object.keys(mergedData).forEach(key => {
            const prefix = extractPrefix(key);
    
            if (mergedData[key].is_unowned === true) {
                if (unownedTracker.has(prefix)) {
                    // Set the extra unowned instances to owned: false
                    mergedData[key].is_unowned = false;
                } else {
                    unownedTracker.add(prefix);
                }
            }
    
            finalData[key] = mergedData[key];
        });
    
        console.log("Merge process completed.");
        return finalData;
    }     
    
    useEffect(() => {
        ownershipDataRef.current = data.ownershipData;
    }, [data.ownershipData]);   
    
    // Define the resetData function
    const resetData = () => {
        // Reset the state to the initial loading state
        setData({
            variants: [],
            ownershipData: {},
            lists: {},
            loading: true // This will trigger the useEffect to refetch data
        });
    };

    const setOwnershipData = (newOwnershipData) => {
        setData(prevData => {
            const updatedOwnershipData = mergeOwnershipData(prevData.ownershipData, newOwnershipData);
            // Immediately update the ref to keep it in sync with state changes.
            ownershipDataRef.current = updatedOwnershipData;

            localStorage.setItem('pokemonOwnership', JSON.stringify({ data: updatedOwnershipData, timestamp: Date.now() }));
    
            // Update state
            return {
                ...prevData,
                ownershipData: updatedOwnershipData,
                lists: initializePokemonLists(updatedOwnershipData, prevData.variants),
            };
        });

        // Now post the updated data to service workers or any other side effects
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                action: 'syncData',
                data: { data: ownershipDataRef.current, timestamp: Date.now() }
            });
            registration.active.postMessage({
                action: 'syncLists',
                data: { data: initializePokemonLists(ownershipDataRef.current, data.variants), timestamp: Date.now() }
            });
        });
    };  
    
    // Context value includes all state and the update function
    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership,
        updateLists,
        updateDetails,
        setOwnershipData,
        resetData,
        updateIsLoggedIn // Expose resetData to the context value
    }), [data, updateOwnership, updateDetails, updateIsLoggedIn]);

    // Provider wraps children with the Pokemon data context
    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

// Exporting the Context object itself along with other components
export { PokemonDataContext };
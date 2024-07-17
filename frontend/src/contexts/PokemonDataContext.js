// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { getPokemons } from '../components/Collect/utils/api';
import { updatePokemonDetails } from '../components/Collect/PokemonOwnership/pokemonOwnershipManager';
import { updatePokemonOwnership } from '../components/Collect/PokemonOwnership/PokemonOwnershipUpdateService';
import { initializePokemonLists, updatePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';
import { initializeOrUpdateOwnershipData, initializeOrUpdateOwnershipDataAsync } from '../components/Collect/PokemonOwnership/pokemonOwnershipStorage';
import createPokemonVariants from '../components/Collect/utils/createPokemonVariants';
import { determinePokemonKey, preloadImage } from '../components/Collect/utils/imageHelpers'; 
import { isDataFresh } from '../components/Collect/utils/cacheHelpers';
import { formatTimeAgo } from '../components/Collect/utils/formattingHelpers';

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

    // Ref to always hold the latest ownershipData
    const ownershipDataRef = useRef(data.ownershipData);

    // Effect to fetch data on component mount
    useEffect(() => {
        async function fetchData() {
            console.log("Fetching data from API or cache...");
            const pokemonDataCacheKey = "pokemonData";
            const variantsCacheKey = "pokemonVariants";
            const ownershipDataCacheKey = "pokemonOwnership";
            const listsCacheKey = "pokemonLists"
            const cacheStorageName = 'pokemonCache';

            // Open the cache storage
            const cacheStorage = await caches.open(cacheStorageName);

            // Try to retrieve the cached variants and ownership data simultaneously
            const [cachedVariantsResponse, cachedOwnershipResponse, cachedListsResponse] = await Promise.all([
                cacheStorage.match(variantsCacheKey),
                cacheStorage.match(ownershipDataCacheKey),
                cacheStorage.match(listsCacheKey)
            ]);

            let freshDataAvailable = false;
            let variants, ownershipData, lists;

            // Deserialize responses if available
            const cachedVariants = cachedVariantsResponse ? await cachedVariantsResponse.json() : null;
            const cachedOwnership = cachedOwnershipResponse ? await cachedOwnershipResponse.json() : null;
            const cachedLists = cachedListsResponse ? await cachedListsResponse.json() : null;

            // Log cached data freshness and details
            if (cachedVariants && cachedOwnership && cachedLists) {
                // Both cached data are available
                console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
                console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
                console.log(`Cached Lists Data Age: ${formatTimeAgo(cachedLists.timestamp)}`);

            } else if (cachedVariants && !cachedOwnership) {
                // Only cached variants are available
                console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
                console.log("Ownership data is missing.");
            } else if (!cachedVariants && cachedOwnership) {
                // Only cached ownership data is available
                console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
                console.log("Variants data is missing.");
            } else {
                // Both cached data are missing
                console.log("Both Variants and Ownership data are missing.");
            }

            // Best case scenario - All Data is less than 24hrs old
            if (cachedVariants && cachedOwnership && cachedLists && isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp) && isDataFresh(cachedLists.timestamp)) {
                console.log("Using cached variants and ownership data");
                variants = cachedVariants.data;
                ownershipData = cachedOwnership.data;
                lists = cachedLists.data
                freshDataAvailable = true;

            // Ownership Data is fresh in the browser but the Pokemon Variants data is possibly outdated.
            } else if (cachedVariants && cachedOwnership && !isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp)) {
                console.log("Cached Variants are too old but Ownership Data is current, checking if localstorage pokemon data is fresh");
                let pokemons;
                const cachedData = localStorage.getItem(pokemonDataCacheKey);
                if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                    console.log("Using data from local storage");
                    pokemons = JSON.parse(cachedData).data;
                } else {
                    console.log("Local storage is not fresh, Fetching new data from API");
                    pokemons = await getPokemons();
                    localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data: pokemons, timestamp: Date.now() }));
                    console.log("Got new data from API, storing in Local Storage");
                }
            
                // Process pokemons into variants
                variants = createPokemonVariants(pokemons);
                variants.forEach(variant => {
                    variant.pokemonKey = determinePokemonKey(variant);
                    preloadImage(variant.currentImage); // Preload main image
                    if (variant.type_1_icon) preloadImage(variant.type_1_icon); // Preload type 1 icon
                    if (variant.type_2_icon) preloadImage(variant.type_2_icon); // Preload type 2 icon
                });
            
                // Update cache with new variants
                await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                console.log("We have now stored the up to date Variants in the Cache Storage");

                // Prepare keys for ownership data
                const keys = variants.map(variant => variant.pokemonKey);

                // If Variants data has changed, maybe update ownership data too
                ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
                lists = initializePokemonLists(ownershipData, variants)
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                console.log("As the ownership data may be missing the newest Variants, we have initialized any missing variants in ownershipdata");
                freshDataAvailable = true;

            // Cached Pokemon Variants are updated, but Ownership Data is older than 24 hours - Gotta check if there are new pokemon to be initialized in Ownership data
            } else if (cachedVariants && cachedOwnership && isDataFresh(cachedVariants.timestamp) && !isDataFresh(cachedOwnership.timestamp)) {
                console.log("Using cached variants but Ownershipdata is older than 24 hours and may be outdated");   
                variants = cachedVariants.data;

                const keys = variants.map(variant => variant.pokemonKey);

                // If Ownership cache data is outdated, update it with new Variants.
                ownershipData = await initializeOrUpdateOwnershipDataAsync(keys, variants);
                console.log("we have now initialized any missing variants in ownershipdata");
                lists = initializePokemonLists(ownershipData, variants)
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                freshDataAvailable = true;

            // Cache Pokemon Variants are updated, but Ownership data is missing altogether.
            } else if (cachedVariants && !cachedOwnership && Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
                console.log("Using cached variants but rebuilding ownership data");
                variants = cachedVariants.data;
            } else if (cachedVariants && cachedOwnership && isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp) && !cachedLists) {
                console.log("Variants and ownership data are fresh, but lists are missing, initializing lists data");
                variants = cachedVariants.data;
                ownershipData = cachedOwnership.data;
                lists = initializePokemonLists(ownershipData, variants);
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                freshDataAvailable = true;
            } else {
                console.log("Cached data is stale or incomplete, refetching...");
            }

            // Variants are fresh so we may begin initializing fresh ownershipdata in local storage.
            if (!freshDataAvailable && variants) {
                // Prepare keys for ownership data
                const keys = variants.map(variant => variant.pokemonKey);

                // If no valid cached ownership data, initialize or update from local data
                ownershipData = initializeOrUpdateOwnershipData(keys, variants);
                lists = initializePokemonLists(ownershipData, variants)
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                console.log("Variants were fresh so we've now rebuilt fresh ownership data both in local and cache storage");
                freshDataAvailable = true;
            }

            // Everything is out of date. Must first check if localstorage has anything and if not we hit api and build everything.
            if (!freshDataAvailable) {
                let pokemons;
                const cachedData = localStorage.getItem(pokemonDataCacheKey);
                if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                    console.log("Using data from local storage");
                    pokemons = JSON.parse(cachedData).data;
                } else {
                    console.log("Fetching new data from API");
                    pokemons = await getPokemons();
                    localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data: pokemons, timestamp: Date.now() }));
                }
            
                // Process pokemons into variants
                variants = createPokemonVariants(pokemons);
                variants.forEach(variant => {
                    variant.pokemonKey = determinePokemonKey(variant);
                    preloadImage(variant.currentImage); // Preload main image
                    if (variant.type_1_icon) preloadImage(variant.type_1_icon); // Preload type 1 icon
                    if (variant.type_2_icon) preloadImage(variant.type_2_icon); // Preload type 2 icon
                });
            
                // Update cache with new variants
                await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));

                // Prepare keys for ownership data
                const keys = variants.map(variant => variant.pokemonKey);

                // If no valid cached ownership data, initialize or update from local data
                ownershipData = initializeOrUpdateOwnershipData(keys, variants);
                lists = initializePokemonLists(ownershipData, variants)
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            // Update state with new data
            setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists});
        }

        fetchData().catch(error => {
            console.error("Failed to load Pokemon data:", error);
            setData(prev => ({ ...prev, loading: false }));
        });
    }, []);

    // Function to update Pokemon lists
    const updateLists = useCallback(() => {
        updatePokemonLists(data.ownershipData, data.variants, sortedLists => {
            // Update the local state with the new lists
            setData(prevData => ({
                ...prevData,
                lists: sortedLists
            }));

            // Send updated lists to the service worker
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    action: 'syncLists',
                    data: { data: sortedLists, timestamp: Date.now() }
                });
            });
        });
    }, [data.ownershipData, data.variants]);

    // Function to update ownership status
    const updateOwnership = useCallback((pokemonKeys, newStatus) => {
        const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
        const tempOwnershipData = { ...ownershipDataRef.current };
        let processedKeys = 0;

        const updates = new Map();
        // console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);
        keys.forEach(key => {
            // console.log(`Processing key: ${key}`);
            updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, (fullKey) => {
                processedKeys++;
                if (fullKey) {
                    if (tempOwnershipData[fullKey]) {
                        // console.log(`Updating fullKey: ${fullKey}, Current Data:`, tempOwnershipData[fullKey]);
                        updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: Date.now() });
                    } else {
                        // console.warn(`Key ${fullKey} has no data in tempOwnershipData`);
                        updates.set(fullKey, { last_update: Date.now() });
                    }
                }
                if (processedKeys === keys.length) { // Only update state and SW when all keys are processed
                    // console.log(`All keys processed. Updating state and service worker.`);
                    setData(prevData => ({
                        ...prevData,
                        ownershipData: tempOwnershipData
                    }));

                    // Update the ref
                    ownershipDataRef.current = tempOwnershipData;

                    keys.forEach(key => {
                        if (tempOwnershipData[key] &&
                            tempOwnershipData[key].is_unowned === true &&
                            tempOwnershipData[key].is_owned === false &&
                            tempOwnershipData[key].is_for_trade === false &&
                            tempOwnershipData[key].is_wanted === false) {
    
                            let keyParts = key.split('_');
                            keyParts.pop(); // Remove the UUID part
                            let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
    
                            let relatedInstances = Object.keys(tempOwnershipData).filter(k => {
                                let parts = k.split('_');
                                parts.pop(); // Remove the UUID part
                                let currentPrefix = parts.join('_');
                                return currentPrefix === basePrefix && k !== key;
                            });
    
                            let isOnlyInstance = relatedInstances.length === 0; // Check if there are no other related instances
    
                            if (!isOnlyInstance) {
                                // If there are other instances, confirm deletion
                                delete tempOwnershipData[key]; // Delete the instance from temp ownership data
                            }
                        }
                    });

                    navigator.serviceWorker.ready.then(async registration => {
                        registration.active.postMessage({
                            action: 'syncData',
                            data: { data: tempOwnershipData, timestamp: Date.now() }
                        });

                        // Cache the updates for the service worker to pick up
                        const cache = await caches.open('pokemonCache');
                        const cachedUpdates = await cache.match('/batchedUpdates');
                        let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

                        updates.forEach((value, key) => {
                            updatesData[key] = value;
                        });

                        await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
                            headers: { 'Content-Type': 'application/json' }
                        }));

                        // Trigger the service worker to schedule sync
                        registration.active.postMessage({
                            action: 'scheduleSync'
                        });

                        updateLists();
                    });
                }
            });
        });
    }, [data.variants, updateLists]); 

    // Function to update Instance details
    const updateDetails = useCallback((pokemonKey, details) => {
        updatePokemonDetails(pokemonKey, details, data.ownershipData);

        // Assuming the update is successful, we update the context state
        const newData = { ...data.ownershipData };
        newData[pokemonKey] = { ...newData[pokemonKey], ...details };

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
        setOwnershipData // Add setOwnershipData to context value
    }), [data, updateOwnership, updateDetails]);

    // Provider wraps children with the Pokemon data context
    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

// Exporting the Context object itself along with other components
export { PokemonDataContext };
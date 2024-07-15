// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback } from 'react';
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
        const tempOwnershipData = { ...data.ownershipData }; // Cloning to avoid direct mutation
        let processedKeys = 0;

        const updates = new Map();

        keys.forEach(key => {
            updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, (fullKey) => {
                processedKeys++;
                if (fullKey) {
                    updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: Date.now() });
                }
                if (processedKeys === keys.length) { // Only update state and SW when all keys are processed
                    setData(prevData => ({
                        ...prevData,
                        ownershipData: tempOwnershipData
                    }));
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
    }, [data.variants, data.ownershipData, updateLists]);

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

    // Function to set ownership data and reinitialize lists
    const setOwnershipData = (newOwnershipData) => {
        setData(prevData => {
            // Access variants from prevData to ensure it uses the current state
            const updatedLists = initializePokemonLists(newOwnershipData, prevData.variants);

            return {
                ...prevData,
                ownershipData: newOwnershipData,
                lists: updatedLists, // Set the updated lists
            };
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
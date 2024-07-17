// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AuthContext, useAuth } from './AuthContext';
import { getPokemons } from '../components/Collect/utils/api';
import { updatePokemonDetails } from '../components/Collect/PokemonOwnership/pokemonOwnershipManager';
import { updatePokemonOwnership } from '../components/Collect/PokemonOwnership/PokemonOwnershipUpdateService';
import { initializePokemonLists, updatePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';
import { initializeOrUpdateOwnershipData, initializeOrUpdateOwnershipDataAsync } from '../components/Collect/PokemonOwnership/pokemonOwnershipStorage';
import createPokemonVariants from '../components/Collect/utils/createPokemonVariants';
import { determinePokemonKey, preloadImage } from '../components/Collect/utils/imageHelpers'; 
import { isDataFresh } from '../components/Collect/utils/cacheHelpers';
import { formatTimeAgo } from '../components/Collect/utils/formattingHelpers';

const PokemonDataContext = createContext();

export const usePokemonData = () => useContext(PokemonDataContext);

export const PokemonDataProvider = ({ children }) => {
    const { isLoggedIn } = useAuth();  // Get isLoggedIn from Auth context

    const [data, setData] = useState({
        variants: [],
        ownershipData: {},
        lists: {},
        loading: true
    });

    const ownershipDataRef = useRef(data.ownershipData);

    useEffect(() => {
        async function fetchData() {
            console.log("Fetching data from API or cache...");
            const pokemonDataCacheKey = "pokemonData";
            const variantsCacheKey = "pokemonVariants";
            const ownershipDataCacheKey = "pokemonOwnership";
            const listsCacheKey = "pokemonLists"
            const cacheStorageName = 'pokemonCache';

            const cacheStorage = await caches.open(cacheStorageName);

            const [cachedVariantsResponse, cachedOwnershipResponse, cachedListsResponse] = await Promise.all([
                cacheStorage.match(variantsCacheKey),
                cacheStorage.match(ownershipDataCacheKey),
                cacheStorage.match(listsCacheKey)
            ]);

            let freshDataAvailable = false;
            let variants, ownershipData, lists;

            const cachedVariants = cachedVariantsResponse ? await cachedVariantsResponse.json() : null;
            const cachedOwnership = cachedOwnershipResponse ? await cachedOwnershipResponse.json() : null;
            const cachedLists = cachedListsResponse ? await cachedListsResponse.json() : null;

            if (cachedVariants && cachedOwnership && cachedLists) {
                console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
                console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
                console.log(`Cached Lists Data Age: ${formatTimeAgo(cachedLists.timestamp)}`);
            } else if (cachedVariants && !cachedOwnership) {
                console.log(`Cached Variants Age: ${formatTimeAgo(cachedVariants.timestamp)}`);
                console.log("Ownership data is missing.");
            } else if (!cachedVariants && cachedOwnership) {
                console.log(`Cached Ownership Data Age: ${formatTimeAgo(cachedOwnership.timestamp)}`);
                console.log("Variants data is missing.");
            } else {
                console.log("Both Variants and Ownership data are missing.");
            }

            if (cachedVariants && cachedOwnership && cachedLists && isDataFresh(cachedVariants.timestamp) && isDataFresh(cachedOwnership.timestamp) && isDataFresh(cachedLists.timestamp)) {
                console.log("Using cached variants and ownership data");
                variants = cachedVariants.data;
                ownershipData = cachedOwnership.data;
                lists = cachedLists.data
                freshDataAvailable = true;
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
            
                variants = createPokemonVariants(pokemons);
                variants.forEach(variant => {
                    variant.pokemonKey = determinePokemonKey(variant);
                    preloadImage(variant.currentImage); 
                    if (variant.type_1_icon) preloadImage(variant.type_1_icon); 
                    if (variant.type_2_icon) preloadImage(variant.type_2_icon); 
                });
            
                await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                console.log("We have now stored the up to date Variants in the Cache Storage");

                const keys = variants.map(variant => variant.pokemonKey);

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
            } else if (cachedVariants && cachedOwnership && isDataFresh(cachedVariants.timestamp) && !isDataFresh(cachedOwnership.timestamp)) {
                console.log("Using cached variants but Ownershipdata is older than 24 hours and may be outdated");   
                variants = cachedVariants.data;

                const keys = variants.map(variant => variant.pokemonKey);

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

            if (!freshDataAvailable && variants) {
                const keys = variants.map(variant => variant.pokemonKey);

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
            
                variants = createPokemonVariants(pokemons);
                variants.forEach(variant => {
                    variant.pokemonKey = determinePokemonKey(variant);
                    preloadImage(variant.currentImage); 
                    if (variant.type_1_icon) preloadImage(variant.type_1_icon); 
                    if (variant.type_2_icon) preloadImage(variant.type_2_icon); 
                });
            
                await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));

                const keys = variants.map(variant => variant.pokemonKey);

                ownershipData = initializeOrUpdateOwnershipData(keys, variants);
                lists = initializePokemonLists(ownershipData, variants)
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
                await cacheStorage.put(listsCacheKey, new Response(JSON.stringify({ data: lists, timestamp: Date.now() }), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            setData({ variants, ownershipData, lists, loading: false, updateOwnership, updateLists});
        }

        fetchData().catch(error => {
            console.error("Failed to load Pokemon data:", error);
            setData(prev => ({ ...prev, loading: false }));
        });
    }, []);

    const updateLists = useCallback(() => {
        updatePokemonLists(data.ownershipData, data.variants, sortedLists => {
            setData(prevData => ({
                ...prevData,
                lists: sortedLists
            }));

            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    action: 'syncLists',
                    data: { data: sortedLists, timestamp: Date.now() }
                });
            });
        });
    }, [data.ownershipData, data.variants]);

    const updateOwnership = useCallback((pokemonKeys, newStatus) => {
        const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
        const tempOwnershipData = { ...ownershipDataRef.current };
        let processedKeys = 0;

        const updates = new Map();
        console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);
        keys.forEach(key => {
            console.log(`Processing key: ${key}`);
            updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, (fullKey) => {
                processedKeys++;
                if (fullKey) {
                    if (tempOwnershipData[fullKey]) {
                        console.log(`Updating fullKey: ${fullKey}, Current Data:`, tempOwnershipData[fullKey]);
                        updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: Date.now() });
                    } else {
                        console.warn(`Key ${fullKey} has no data in tempOwnershipData`);
                        updates.set(fullKey, { last_update: Date.now() });
                    }
                }
                if (processedKeys === keys.length) { 
                    console.log(`All keys processed. Updating state and service worker.`);
                    setData(prevData => ({
                        ...prevData,
                        ownershipData: tempOwnershipData
                    }));

                    ownershipDataRef.current = tempOwnershipData;

                    navigator.serviceWorker.ready.then(async registration => {
                        registration.active.postMessage({
                            action: 'syncData',
                            data: { data: tempOwnershipData, timestamp: Date.now() }
                        });

                        const cache = await caches.open('pokemonCache');
                        const cachedUpdates = await cache.match('/batchedUpdates');
                        let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

                        updates.forEach((value, key) => {
                            updatesData[key] = value;
                        });

                        await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
                            headers: { 'Content-Type': 'application/json' }
                        }));

                        registration.active.postMessage({
                            action: 'scheduleSync'
                        });

                        updateLists();
                    });
                }
            }, isLoggedIn); // Pass isLoggedIn here
        });
    }, [data.variants, updateLists, isLoggedIn]); 

    const updateDetails = useCallback((pokemonKey, details) => {
        updatePokemonDetails(pokemonKey, details, data.ownershipData);

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

            registration.active.postMessage({
                action: 'scheduleSync'
            });

            updateLists();
        });
    }, [data.ownershipData, updateLists]);

    function mergeOwnershipData(oldData, newData) {
        const mergedData = {};
        const oldDataProcessed = {};
    
        const extractPrefix = (key) => {
            const keyParts = key.split('_');
            keyParts.pop(); 
            return keyParts.join('_'); 
        };
    
        console.log("Starting merge process...");
    
        Object.keys(newData).forEach(key => {
            const prefix = extractPrefix(key);
            if (oldData.hasOwnProperty(key)) {
                const newDate = new Date(newData[key].last_update);
                const oldDate = new Date(oldData[key].last_update);
                if (newDate > oldDate) {
                    mergedData[key] = newData[key];
                } else {
                    mergedData[key] = oldData[key];
                }
                console.log(`Merging based on latest update for key: ${key}`);
            } else {
                mergedData[key] = newData[key];
            }
            oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
            oldDataProcessed[prefix].push(key);
            console.log(`Processed new key: ${key} with prefix: ${prefix}`);
        });
    
        Object.keys(oldData).forEach(oldKey => {
            const prefix = extractPrefix(oldKey);
            if (!oldDataProcessed[prefix]) {
                mergedData[oldKey] = oldData[oldKey];
            } else {
                const significantOld = oldData[oldKey].is_owned || oldData[oldKey].is_for_trade || oldData[oldKey].is_wanted;
                const anySignificantNew = oldDataProcessed[prefix].some(newKey =>
                    newData[newKey].is_owned || newData[newKey].is_for_trade || newData[newKey].is_wanted);
    
                if (significantOld && !anySignificantNew) {
                    mergedData[oldKey] = oldData[oldKey];
                    console.log(`Retaining significant old data for key: ${oldKey}`);
                } else {
                    console.log(`New significant data found or updated for prefix: ${prefix}. Not duplicating entry for key: ${oldKey}`);
                }
            }
        });
    
        console.log("Merge process completed.");
        return mergedData;
    }        
    
    useEffect(() => {
        ownershipDataRef.current = data.ownershipData;
    }, [data.ownershipData]);    

    const setOwnershipData = (newOwnershipData) => {
        setData(prevData => {
            const updatedOwnershipData = mergeOwnershipData(prevData.ownershipData, newOwnershipData);
            ownershipDataRef.current = updatedOwnershipData;
    
            return {
                ...prevData,
                ownershipData: updatedOwnershipData,
                lists: initializePokemonLists(updatedOwnershipData, prevData.variants),
            };
        });
    
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
    
    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership,
        updateLists,
        updateDetails,
        setOwnershipData 
    }), [data, updateOwnership, updateDetails]);

    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

export { PokemonDataContext };

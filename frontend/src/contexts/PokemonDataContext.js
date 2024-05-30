// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getPokemons } from '../components/Collect/utils/api';
import { initializeOrUpdateOwnershipData, updatePokemonOwnership, syncAndSaveUpdates } from '../components/Collect/utils/pokemonOwnershipManager';
import createPokemonVariants from '../components/Collect/utils/createPokemonVariants';
import { determinePokemonKey } from '../components/Collect/utils/imageHelpers'; 

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
        loading: true
    });

    // Effect to fetch data on component mount
    useEffect(() => {
        async function fetchData() {
            console.log("Fetching data from API or cache...");
            const pokemonDataCacheKey = "pokemonData";
            const variantsCacheKey = "pokemonVariants";
            const ownershipDataCacheKey = "pokemonOwnership";
            const cacheStorageName = 'pokemonCache';

            // Open the cache storage
            const cacheStorage = await caches.open(cacheStorageName);

            // Try to retrieve the cached variants and ownership data simultaneously
            const [cachedVariantsResponse, cachedOwnershipResponse] = await Promise.all([
                cacheStorage.match(variantsCacheKey),
                cacheStorage.match(ownershipDataCacheKey)
            ]);

            let freshDataAvailable = false;
            let variants, ownershipData;

            // Deserialize responses if available
            const cachedVariants = cachedVariantsResponse ? await cachedVariantsResponse.json() : null;
            const cachedOwnership = cachedOwnershipResponse ? await cachedOwnershipResponse.json() : null;

            // Check both caches for freshness
            if (cachedVariants && cachedOwnership &&
                Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000 &&
                Date.now() - cachedOwnership.timestamp < 24 * 60 * 60 * 1000) {
                console.log("Using cached variants and ownership data");
                variants = cachedVariants.data;
                ownershipData = cachedOwnership.data;
                freshDataAvailable = true;
            } else if (cachedVariants && !cachedOwnership &&
                Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
                console.log("Using cached variants but rebuilding ownership data");
                variants = cachedVariants.data;
            } else {
                console.log("Cached data is stale or incomplete, refetching...");
            }

            if (!freshDataAvailable && variants) {
                // Prepare keys for ownership data
                const keys = variants.map(variant => variant.pokemonKey);

                // If no valid cached ownership data, initialize or update from local data
                ownershipData = initializeOrUpdateOwnershipData(keys, variants);
                // console.log("Updated ownership data:", ownershipData);
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() })));
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
            
                // Process pokemons into variants
                variants = createPokemonVariants(pokemons);
                variants.forEach(variant => {
                    variant.pokemonKey = determinePokemonKey(variant);
                    preloadImage(variant.currentImage); // Preload main image
                    if (variant.type_1_icon) preloadImage(variant.type_1_icon); // Preload type 1 icon
                    if (variant.type_2_icon) preloadImage(variant.type_2_icon); // Preload type 2 icon
                });
            
                // Update cache with new variants
                await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() })));

                // Prepare keys for ownership data
                const keys = variants.map(variant => variant.pokemonKey);

                // If no valid cached ownership data, initialize or update from local data
                ownershipData = initializeOrUpdateOwnershipData(keys, variants);
                // console.log("Updated ownership data:", ownershipData);
                await cacheStorage.put(ownershipDataCacheKey, new Response(JSON.stringify({ data: ownershipData, timestamp: Date.now() })));
            }

            // Update state with new data
            setData({ variants, ownershipData, loading: false });
        }

        fetchData().catch(error => {
            console.error("Failed to load Pokemon data:", error);
            setData(prev => ({ ...prev, loading: false }));
        });
    }, []);

    // Function to update ownership status
    const updateOwnership = useCallback((pokemonKey, newStatus) => {
        updatePokemonOwnership(pokemonKey, newStatus, data.variants, (newOwnershipData) => {
            setData(prevData => ({
                ...prevData,
                ownershipData: { ...prevData.ownershipData, ...newOwnershipData }
              }));              
        });
    }, [data.variants]);

    // Context value includes all state and the update function
    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership
    }), [data, updateOwnership]);

    // Provider wraps children with the Pokemon data context
    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

// Utility function to preload images
const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};

// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getPokemons } from '../components/Collect/utils/api';
import { initializeOrUpdateOwnershipData, updatePokemonOwnership } from '../components/Collect/utils/pokemonOwnershipManager';
import createPokemonVariants from '../components/Collect/utils/createPokemonVariants';
import { determinePokemonKey } from '../components/Collect/utils/imageHelpers'; 

const PokemonDataContext = createContext();

export const usePokemonData = () => useContext(PokemonDataContext);

export const PokemonDataProvider = ({ children }) => {
    const [data, setData] = useState({
        variants: [],
        ownershipData: {},
        loading: true,
    });

    useEffect(() => {
        async function fetchData() {
            console.log("Fetching data from API or cache...");
            const pokemonDataCacheKey = "pokemonData";
            const variantsCacheKey = "pokemonVariants";
            const cacheStorageName = 'pokemonCache';

            const cacheStorage = await caches.open(cacheStorageName);
            const cachedVariantsResponse = await cacheStorage.match(variantsCacheKey);
            let pokemons;

            if (cachedVariantsResponse) {
                const cachedVariants = await cachedVariantsResponse.json();
                console.log("Checking cache freshness...");
                if (Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
                    console.log("Using cached variants data");
                    setData(prev => {
                        if (JSON.stringify(prev.variants) !== JSON.stringify(cachedVariants.data)) {
                            return { ...prev, variants: cachedVariants.data, loading: false };
                        }
                        return prev;
                    });
                    return;
                } else {
                    console.log("Cached data is stale, refetching...");
                }
            }

            const cachedData = localStorage.getItem(pokemonDataCacheKey);
            if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                console.log("Using data from local storage");
                pokemons = JSON.parse(cachedData).data;
            } else {
                console.log("Fetching new data from API");
                pokemons = await getPokemons();
                localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data: pokemons, timestamp: Date.now() }));
            }

            const variants = createPokemonVariants(pokemons);
            variants.forEach(variant => {
                variant.pokemonKey = determinePokemonKey(variant);
                preloadImage(variant.currentImage);
                if (variant.type_1_icon) preloadImage(variant.type_1_icon);
                if (variant.type_2_icon) preloadImage(variant.type_2_icon);
            });

            const keys = variants.map(variant => variant.pokemonKey);
            const ownershipData = await initializeOrUpdateOwnershipData(keys, variants);
            await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({ data: variants, timestamp: Date.now() })));

            setData({ variants, ownershipData, loading: false });
        }

        fetchData().catch(error => {
            console.error("Failed to load Pokemon data:", error);
            setData(prev => ({ ...prev, loading: false }));
        });
    }, []);

    const updateOwnership = useCallback((pokemonKey, newStatus) => {
        // Call updatePokemonOwnership with the context's set function
        updatePokemonOwnership(pokemonKey, newStatus, data.variants, (newOwnershipData) => {
            setData(prev => ({
                ...prev,
                ownershipData: newOwnershipData
            }));
        });
    }, [data.variants]);

    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership
    }), [data, updateOwnership]);

    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};

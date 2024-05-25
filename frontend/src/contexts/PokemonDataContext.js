// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo } from 'react';
import { getPokemons } from '../components/Collect/utils/api';
import { initializeOrUpdateOwnershipData } from '../components/Collect/utils/pokemonOwnershipManager';
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
            const pokemonDataCacheKey = "pokemonData";
            const variantsCacheKey = "pokemonVariants";
            const cacheStorageName = 'pokemonCache';

            const cacheStorage = await caches.open(cacheStorageName);
            const cachedVariantsResponse = await cacheStorage.match(variantsCacheKey);
            let pokemons;

            if (cachedVariantsResponse) {
                const cachedVariants = await cachedVariantsResponse.json();
                if (Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
                    setData(prev => ({ ...prev, variants: cachedVariants.data, loading: false }));
                    return;
                }
            }

            const cachedData = localStorage.getItem(pokemonDataCacheKey);
            if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                pokemons = JSON.parse(cachedData).data;
            } else {
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

    const contextValue = useMemo(() => data, [data]);

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


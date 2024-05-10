// useFetchPokemons.js

import { useState, useEffect, useContext } from 'react';
import CacheContext from '../../../contexts/CacheContext';
import { getPokemons } from '../utils/api';
import { determinePokemonKey } from '../utils/imageHelpers';
import createPokemonVariants from '../utils/createPokemonVariants';
import { initializeOrUpdateOwnershipData, ownershipDataCacheKey } from '../utils/pokemonOwnershipManager';

const useFetchPokemons = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const cache = useContext(CacheContext);

    useEffect(() => {
        const pokemonDataCacheKey = "pokemonData";
        const variantsCacheKey = "pokemonVariants";
        const cacheStorageName = 'pokemonCache'; // Define the cache storage name

        const fetchData = async () => {
            setLoading(true);
            const cacheStorage = await caches.open(cacheStorageName); // Open/Create a cache store
            const cachedVariantsResponse = await cacheStorage.match(variantsCacheKey);
            let data;
            let isNewData = false;

            if (cachedVariantsResponse) {
                const cachedVariants = await cachedVariantsResponse.json();
                // Reassign keys and preload images after loading from cache
                cachedVariants.forEach(variant => {
                    const key = determinePokemonKey(variant);
                    variant.pokemonKey = key; // Reassign key
                    preloadImage(variant.currentImage, key); // Ensure images are preloaded
                    if (variant.type_1_icon) {
                        preloadImage(variant.type_1_icon, variant.type_1_icon);
                    }
                    if (variant.type_2_icon) {
                        preloadImage(variant.type_2_icon, variant.type_2_icon);
                    }
                });
                setVariants(cachedVariants);
                setLoading(false);
                console.log('Using cached variants.');
                return;
            }

            const cachedData = localStorage.getItem(pokemonDataCacheKey);
            if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                data = JSON.parse(cachedData).data;
                console.log('Using cached data for Pokémon.');
            } else {
                data = await getPokemons();
                localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                console.log('Fetched new data and updated cache for Pokémon.');
                isNewData = true;
            }

            const generatedVariants = createPokemonVariants(data);
            console.log('Variants:', generatedVariants);

            generatedVariants.forEach(variant => {
                const key = determinePokemonKey(variant);
                variant.pokemonKey = key; // Ensure key is assigned
                preloadImage(variant.currentImage, key);
                initializeOrUpdateOwnershipData(key, isNewData);
                // Preload type icons if they exist and are not already loaded
                if (variant.type_1_icon) {
                    preloadImage(variant.type_1_icon, variant.type_1_icon);
                }
                if (variant.type_2_icon) {
                    preloadImage(variant.type_2_icon, variant.type_2_icon);
                }
            });

            await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify(generatedVariants)));
            console.log("Current Pokémon Ownership Status:", JSON.parse(localStorage.getItem(ownershipDataCacheKey)));
            cache.set(variantsCacheKey, generatedVariants);
            setVariants(generatedVariants);
            setLoading(false);
        };

        fetchData().catch(error => {
            console.error("Error fetching the Pokémon data: ", error);
            setLoading(false);
        });
    }, []);

    const preloadImage = (url, key) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            cache.set(key, url);
        };
    };

    return { variants, loading };
};

export default useFetchPokemons;

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
        console.log('useFetchPokemons effect triggered');
        const pokemonDataCacheKey = "pokemonData";
        const variantsCacheKey = "pokemonVariants";
        const cacheStorageName = 'pokemonCache'; // Define the cache storage name

        const fetchData = async () => {
            console.log('Starting fetchData function');
            setLoading(true);
            console.log('Attempting to open cache:', cacheStorageName);
            const cacheStorage = await caches.open(cacheStorageName); // Open/Create a cache store
            console.log('Cache opened, matching variants cache key:', variantsCacheKey);
            const cachedVariantsResponse = await cacheStorage.match(variantsCacheKey);
            let data;

            if (cachedVariantsResponse) {
                console.log('Cached variants response found, converting to JSON');
                const cachedVariants = await cachedVariantsResponse.json();
                console.log('Cached variants JSON parsed');
                // Check timestamp for variants
                if (Date.now() - cachedVariants.timestamp < 24 * 60 * 60 * 1000) {
                    console.log('Cached variants are fresh, using them');
                    const keys = [];
                    // Reassign keys and preload images after loading from cache
                    cachedVariants.data.forEach(variant => {
                        const key = determinePokemonKey(variant);
                        variant.pokemonKey = key; // Reassign key
                        preloadImage(variant.currentImage, key); // Ensure images are preloaded
                        keys.push(key);
                        if (variant.type_1_icon) {
                            preloadImage(variant.type_1_icon, variant.type_1_icon);
                        }
                        if (variant.type_2_icon) {
                            preloadImage(variant.type_2_icon, variant.type_2_icon);
                        }
                    });

                    initializeOrUpdateOwnershipData(keys, cachedVariants.data);

                    setVariants(cachedVariants.data);
                    setLoading(false);
                    console.log('Using cached variants.');
                    return;
                } else {
                    console.log('Cached variants are stale, fetching new data');
                }
            }

            const cachedData = localStorage.getItem(pokemonDataCacheKey);
            if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
                data = JSON.parse(cachedData).data;
                console.log('Using cached data for Pokémon.');
            } else {
                console.log('No fresh cached data available, fetching from API');
                data = await getPokemons();
                localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data, timestamp: Date.now() }));
                console.log('Fetched new data and updated cache for Pokémon.');
            }

            const generatedVariants = createPokemonVariants(data);
            console.log('Generated new variants:', generatedVariants);

            const keys = [];

            generatedVariants.forEach(variant => {
                const key = determinePokemonKey(variant);
                variant.pokemonKey = key; // Ensure key is assigned
                preloadImage(variant.currentImage, key);
                keys.push(key);
                if (variant.type_1_icon) {
                    preloadImage(variant.type_1_icon, variant.type_1_icon);
                }
                if (variant.type_2_icon) {
                    preloadImage(variant.type_2_icon, variant.type_2_icon);
                }
            });

            console.log('Initializing or updating ownership data');
            initializeOrUpdateOwnershipData(keys, generatedVariants);

            console.log('Putting data in cache');
            await cacheStorage.put(variantsCacheKey, new Response(JSON.stringify({data: generatedVariants, timestamp: Date.now()})));
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
        // console.log('Preloading image', url);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            // console.log('Image loaded and cached:', url);
            cache.set(key, url);
        };
    };

    return { variants, loading };
};

export default useFetchPokemons;

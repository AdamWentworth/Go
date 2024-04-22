// useFetchPokemons.js

import { useState, useEffect, useContext } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { getPokemons } from '../../utils/api';
import { determinePokemonKey } from '../../utils/imageHelpers';
import createPokemonVariants from '../../utils/createPokemonVariants';
import { initializeOrUpdateOwnershipData, ownershipDataCacheKey } from '../../utils/pokemonOwnershipManager';

const useFetchPokemons = () => {
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const cache = useContext(CacheContext);

    useEffect(() => {
        const pokemonDataCacheKey = "pokemonData";
        const variantsCacheKey = "pokemonVariants";

        const fetchData = async () => {
            setLoading(true);
            const cachedData = localStorage.getItem(pokemonDataCacheKey);
            let data;
            let isNewData = false;
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
                variant.pokemonKey = key;
                const imageUrl = variant.currentImage;
                preloadImage(imageUrl, key);
                initializeOrUpdateOwnershipData(key, isNewData);
            });

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

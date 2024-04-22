// useFetchPokemons.js

import { useState, useEffect, useContext } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { getPokemons } from '../../utils/api';
import { determinePokemonKey } from '../../utils/imageHelpers';
import createPokemonVariants from '../../utils/createPokemonVariants';

const useFetchPokemons = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const cache = useContext(CacheContext);

  useEffect(() => {
    const pokemonDataCacheKey = "pokemonData";
    const variantsCacheKey = "pokemonVariants";

    const fetchData = async () => {
      setLoading(true);
      // Check if cached data exists and hasn't expired
      const cachedData = localStorage.getItem(pokemonDataCacheKey);
      let data;
      if (cachedData && (Date.now() - JSON.parse(cachedData).timestamp < 24 * 60 * 60 * 1000)) {
        data = JSON.parse(cachedData).data;  // Use cached data if available and valid
        console.log('Using cached data for Pokémon.');
      } else {
        data = await getPokemons();  // Fetch new data if no cache or cache is old
        localStorage.setItem(pokemonDataCacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        console.log('Fetched new data and updated cache for Pokémon.');
      }

      const generatedVariants = createPokemonVariants(data);
      console.log('Variants:', generatedVariants);

      generatedVariants.forEach(variant => {
        variant.pokemonKey = determinePokemonKey(variant);
        const imageUrl = variant.currentImage;
        preloadImage(imageUrl, variant.pokemonKey);
      });

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
      cache.set(key, url); // Caching the image URL under its unique key
    };
  };

  return { variants, loading };
};

export default useFetchPokemons;







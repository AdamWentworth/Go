// useFetchPokemons.js

import { useState, useEffect, useContext } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { getPokemons } from '../../utils/api';
import { determinePokemonImage, determinePokemonKey } from '../../utils/imageHelpers';
import createPokemonVariants from '../../utils/createPokemonVariants';

const useFetchPokemons = () => {
  const [variants, setVariants] = useState([]); // Changed to store variants directly
  const [loading, setLoading] = useState(true);
  const cache = useContext(CacheContext);

  useEffect(() => {
    const variantsCacheKey = "pokemonVariants";
    
    getPokemons().then(data => {
      const generatedVariants = createPokemonVariants(data);
      console.log('Variants:', generatedVariants)

      generatedVariants.forEach(variant => {
        variant.pokemonKey = determinePokemonKey(variant); // Assign pokemonKey to each variant
        const imageUrl = variant.currentImage;
        preloadImage(imageUrl, variant.pokemonKey);
      });

      // Cache the generated variants directly
      cache.set(variantsCacheKey, generatedVariants);
      console.log(`Cached ${generatedVariants.length} variants in CacheContext under key '${variantsCacheKey}'`);
      // Update state to hold variants instead of allPokemons
      setVariants(generatedVariants);

      setLoading(false);
    }).catch(error => {
      console.error("Error fetching the Pokémon data: ", error);
      setLoading(false);
    });
  }, []);

  const preloadImage = (url, key) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      cache.set(key, url); // Caching the correct image URL under its unique key
    };
  };

  // Adjusted to return variants instead of allPokemons
  return { variants, loading };
};

export default useFetchPokemons;






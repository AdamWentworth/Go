import { useState, useEffect, useContext } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { getPokemons } from '../../utils/api';
import { determinePokemonImage, determinePokemonKey } from '../../utils/imageHelpers';

const EXPIRY_TIME = 24 * 60 * 60 * 1000;  // 24 hours in milliseconds

const useFetchPokemons = () => {
  const [allPokemons, setAllPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const cache = useContext(CacheContext);

  // In useFetchPokemons.js
  useEffect(() => {
    const cacheKey = "allPokemonsData";
    const currentTime = new Date().getTime();
    const localStorageData = localStorage.getItem(cacheKey);
    
    // Check if data exists in localStorage and hasn't expired
    if (localStorageData) {
        const parsedData = JSON.parse(localStorageData);
        if (parsedData.timestamp && currentTime - parsedData.timestamp < EXPIRY_TIME) {
            setAllPokemons(parsedData.data);
            setLoading(false);
            return; // Early exit from the useEffect since we have our data
        }
    }
    
    // If data wasn't in localStorage or was expired, try fetching from the API
    if (!localStorageData || !cache.has(cacheKey)) {
        getPokemons()
            .then(data => {
                setAllPokemons(data);
                cache.set(cacheKey, data);
                
                // Store data in localStorage with a timestamp
                localStorage.setItem(cacheKey, JSON.stringify({ data: data, timestamp: currentTime }));
                
                cachePokemons(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    } else {
        // If data was in cache (but not localStorage or was expired in localStorage)
        setAllPokemons(cache.get(cacheKey));
        setLoading(false);
    }
  }, []);


  const cachePokemons = (pokemons) => {
    pokemons.forEach(pokemon => {
      const imageUrl = determinePokemonImage(pokemon);
      const key = determinePokemonKey(pokemon);  // Fixed function name here

      preloadImage(imageUrl, key);
    });
  };

  const preloadImage = (url, key) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      cache.set(key, url);
    };
  };

  return { allPokemons, loading };
};

export default useFetchPokemons;


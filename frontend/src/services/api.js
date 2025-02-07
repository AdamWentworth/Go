// api.js

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_POKEMON_API_URL;
axios.defaults.withCredentials = true;

export const getPokemons = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/pokemons`);
        console.log('API Response:', response);

        // If we got a 304, get the cached data from localStorage
        if (response.status === 304) {
            console.log('Server returned 304 - Using cached data');
            const cachedData = localStorage.getItem('pokemonData');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                return parsed.data;
            }
            throw new Error('No cached data available for 304 response');
        }

        // For 200 responses, return the new data
        return response.data;
    } catch (error) {
        // Handle axios errors that might contain response data
        if (error.response && error.response.status === 304) {
            console.log('Caught 304 in error handler - Using cached data');
            const cachedData = localStorage.getItem('pokemonData');
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                return parsed.data;
            }
        }
        
        console.error("Error fetching the Pokémon data: ", error);
        throw error;
    }
};
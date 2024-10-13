// api.js

import axios from 'axios';

// Use the environment variable for the base URL
const BASE_URL = process.env.REACT_APP_POKEMON_API_URL;

// Ensure credentials are included in requests
axios.defaults.withCredentials = true;

export const getPokemons = () => {
    return axios.get(`${BASE_URL}/pokemons`)
        .then(response => {
            console.log(response);  // Log the full response
            return response.data;  // Then return the data
        })
        .catch(error => {
            console.error("Error fetching the Pokémon data: ", error);
            throw error;
        });
};

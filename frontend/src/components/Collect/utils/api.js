import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

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

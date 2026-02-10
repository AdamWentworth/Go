// src/services/pokemonDataService.ts

import axios, { AxiosResponse } from 'axios';
import type { Pokemons } from '../types/pokemonBase';

const BASE_URL: string = import.meta.env.VITE_POKEMON_API_URL;
axios.defaults.withCredentials = true;

const isDev = process.env.NODE_ENV === 'development';

export const getPokemons = async (): Promise<Pokemons> => {
  try {
    const response: AxiosResponse<Pokemons> = await axios.get(`${BASE_URL}/pokemons`);
    if (isDev) console.log('API Response:', response);

    // If we got a 304, get the cached data from localStorage
    if (response.status === 304) {
      if (isDev) console.log('Server returned 304 - Using cached data');
      const cachedData = localStorage.getItem('pokemonData');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed.data as Pokemons;
      }
      throw new Error('No cached data available for 304 response');
    }

    const payload = response.data as unknown;
    if (!Array.isArray(payload)) {
      throw new Error(
        `[pokemonDataService] invalid payload shape: expected array, got ${typeof payload}`
      );
    }

    return payload as Pokemons;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 304) {
      if (isDev) console.log('Caught 304 in error handler - Using cached data');
      const cachedData = localStorage.getItem('pokemonData');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return parsed.data as Pokemons;
      }
    }

    console.error("Error fetching the Pokémon data: ", error);
    throw error;
  }
};

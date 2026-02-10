// src/services/pokemonDataService.ts

import axios, { AxiosResponse } from 'axios';
import type { Pokemons } from '../types/pokemonBase';

const BASE_URL: string = import.meta.env.VITE_POKEMON_API_URL;
axios.defaults.withCredentials = true;

const isDev = process.env.NODE_ENV === 'development';
const POKEMON_CACHE_KEY = 'pokemonData';
const POKEMON_ETAG_KEY = 'pokemonDataEtag';

function readCachedPokemons(): Pokemons | null {
  const cachedData = localStorage.getItem(POKEMON_CACHE_KEY);
  if (!cachedData) return null;

  try {
    const parsed = JSON.parse(cachedData) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as Pokemons;
    }
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)) {
      return (parsed as { data: Pokemons }).data;
    }
    return null;
  } catch {
    return null;
  }
}

export const getPokemons = async (): Promise<Pokemons> => {
  try {
    const ifNoneMatch = localStorage.getItem(POKEMON_ETAG_KEY) ?? '';
    const headers = ifNoneMatch ? { 'If-None-Match': ifNoneMatch } : {};

    const response: AxiosResponse<Pokemons> = await axios.get(`${BASE_URL}/pokemons`, {
      headers,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });

    if (isDev) console.log('API Response:', response);

    if (response.status === 304) {
      if (isDev) console.log('Server returned 304 - Using cached data');
      const cached = readCachedPokemons();
      if (cached) return cached;
      throw new Error('No cached data available for 304 response');
    }

    const payload = response.data as unknown;
    if (!Array.isArray(payload)) {
      throw new Error(
        `[pokemonDataService] invalid payload shape: expected array, got ${typeof payload}`,
      );
    }

    const etagHeader = (response.headers?.etag as string | undefined)?.trim();
    if (etagHeader) {
      localStorage.setItem(POKEMON_ETAG_KEY, etagHeader);
    }
    localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify({ data: payload }));

    return payload as Pokemons;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 304) {
      if (isDev) console.log('Caught 304 in error handler - Using cached data');
      const cached = readCachedPokemons();
      if (cached) return cached;
    }

    console.error('Error fetching the Pokemon data: ', error);
    throw error;
  }
};

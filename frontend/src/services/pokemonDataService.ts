// src/services/pokemonDataService.ts

import type { Pokemons } from '../types/pokemonBase';
import { createScopedLogger, loggerInternals } from '@/utils/logger';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';

const BASE_URL: string = import.meta.env.VITE_POKEMON_API_URL;

const log = createScopedLogger('pokemonDataService');
const canDebugLog = loggerInternals.shouldEmit('debug');
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
    const headers: Record<string, string> = {};
    if (ifNoneMatch) {
      headers['If-None-Match'] = ifNoneMatch;
    }
    const response = await requestWithPolicy(buildUrl(BASE_URL, '/pokemons'), {
      method: 'GET',
      headers,
    });
    if (canDebugLog) {
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      log.debug('API response', {
        status: response.status,
        headers: responseHeaders,
      });
    }

    if (response.status === 304) {
      if (canDebugLog) log.debug('Server returned 304 - using cached data');
      const cached = readCachedPokemons();
      if (cached) return cached;
      throw new Error('No cached data available for 304 response');
    }

    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      throw toHttpError(response.status, payload);
    }

    if (!Array.isArray(payload)) {
      throw new Error(
        `[pokemonDataService] invalid payload shape: expected array, got ${typeof payload}`,
      );
    }

    const etagHeader = response.headers.get('etag')?.trim();
    if (etagHeader) {
      localStorage.setItem(POKEMON_ETAG_KEY, etagHeader);
    }
    localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify({ data: payload }));

    return payload as Pokemons;
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon data', error);
    throw error;
  }
};

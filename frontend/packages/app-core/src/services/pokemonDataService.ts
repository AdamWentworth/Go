// src/services/pokemonDataService.ts

import type { Pokemons } from '../types/pokemonBase';
import { createScopedLogger, loggerInternals } from '@/utils/logger';
import { normalizeAssetUrlsDeep } from '@/utils/assetUrl';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';
import { pokemonContract } from '@shared-contracts/pokemon';

const BASE_URL: string = import.meta.env.VITE_POKEMON_API_URL;

const log = createScopedLogger('pokemonDataService');
const canDebugLog = loggerInternals.shouldEmit('debug');
const STALE_LOCAL_STORAGE_KEYS = ['pokemonData', 'pokemonDataEtag'] as const;

function clearStaleLocalStorageCache(): void {
  try {
    for (const key of STALE_LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    log.warn('Unable to clear stale Pokemon localStorage cache', error);
  }
}

export const getPokemons = async (): Promise<Pokemons> => {
  try {
    clearStaleLocalStorageCache();

    const response = await requestWithPolicy(buildUrl(BASE_URL, pokemonContract.endpoints.pokemons), {
      method: 'GET',
      headers: {},
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

    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      throw toHttpError(response.status, payload);
    }

    if (!Array.isArray(payload)) {
      throw new Error(
        `[pokemonDataService] invalid payload shape: expected array, got ${typeof payload}`,
      );
    }

    const normalizedPayload = normalizeAssetUrlsDeep(payload as Pokemons);

    return normalizedPayload;
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon data', error);
    throw error;
  }
};

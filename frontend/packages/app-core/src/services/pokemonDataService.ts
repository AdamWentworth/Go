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
import { pokemonContract, type PokemonCatalogManifest } from '@shared-contracts/pokemon';
import { removeStorageItem } from '@/utils/storage';

const BASE_URL: string = import.meta.env.VITE_POKEMON_API_URL;

const log = createScopedLogger('pokemonDataService');
const canDebugLog = loggerInternals.shouldEmit('debug');
const STALE_LOCAL_STORAGE_KEYS = ['pokemonData', 'pokemonDataEtag'] as const;

type GetPokemonsOptions = {
  manifest?: PokemonCatalogManifest | null;
};

function clearStaleLocalStorageCache(): void {
  for (const key of STALE_LOCAL_STORAGE_KEYS) {
    removeStorageItem(key);
  }
}

function getPokemonFullEndpoint(manifest?: PokemonCatalogManifest | null): string {
  const endpoint = manifest?.chunks?.pokemonFull?.endpoint;
  return typeof endpoint === 'string' && endpoint.trim()
    ? endpoint
    : pokemonContract.endpoints.pokemons;
}

export const getPokemons = async (options: GetPokemonsOptions = {}): Promise<Pokemons> => {
  try {
    clearStaleLocalStorageCache();

    const response = await requestWithPolicy(buildUrl(BASE_URL, getPokemonFullEndpoint(options.manifest)), {
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

export const getPokemonCatalogManifest = async (): Promise<PokemonCatalogManifest> => {
  try {
    const response = await requestWithPolicy(buildUrl(BASE_URL, pokemonContract.endpoints.manifest), {
      method: 'GET',
      headers: {},
    });

    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      throw toHttpError(response.status, payload);
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error(
        `[pokemonDataService] invalid manifest payload shape: expected object, got ${typeof payload}`,
      );
    }

    const manifest = payload as PokemonCatalogManifest;
    if (
      typeof manifest.schemaVersion !== 'number' ||
      typeof manifest.catalogVersion !== 'string' ||
      !manifest.chunks?.pokemonFull ||
      typeof manifest.chunks.pokemonFull.endpoint !== 'string'
    ) {
      throw new Error('[pokemonDataService] invalid manifest payload shape: missing catalog metadata');
    }

    return manifest;
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon catalog manifest', error);
    throw error;
  }
};

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
import {
  pokemonContract,
  type PokemonCatalogManifest,
  type PokemonMovesChunk,
  type PokemonPvPBattleRequest,
  type PokemonPvPBattleResponse,
  type PokemonPvPRankingsPayload,
  type PokemonRaidDataChunk,
} from '@shared-contracts/pokemon';
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

type PokemonChunkName =
  | 'pokemonFull'
  | 'catalog'
  | 'moves'
  | 'raidData'
  | 'maxData'
  | 'pvpData';
const POKEMON_CHUNK_REQUEST_ATTEMPTS = 2;

function normalizeManifestChunkEndpoint(endpoint: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(endpoint)) return endpoint;

  try {
    const browserOrigin = globalThis.location?.origin ?? 'http://localhost';
    const basePath = new URL(BASE_URL, browserOrigin).pathname.replace(/\/+$/, '');
    const serviceName = basePath.split('/').filter(Boolean).at(-1);
    const normalizedEndpoint = `/${endpoint.replace(/^\/+/, '')}`;

    if (serviceName && normalizedEndpoint.startsWith(`/${serviceName}/`)) {
      return normalizedEndpoint.slice(serviceName.length + 1);
    }

    return normalizedEndpoint;
  } catch {
    return endpoint;
  }
}

function getChunkEndpoint(
  manifest: PokemonCatalogManifest | null | undefined,
  chunk: PokemonChunkName,
  fallback: string,
): string {
  const endpoint = manifest?.chunks?.[chunk]?.endpoint;
  return typeof endpoint === 'string' && endpoint.trim()
    ? normalizeManifestChunkEndpoint(endpoint)
    : fallback;
}

export function getCatalogDataVersion(manifest?: PokemonCatalogManifest | null): string | null {
  const version = manifest?.chunks?.catalog?.version ?? manifest?.catalogVersion;
  return typeof version === 'string' && version.trim() ? version : null;
}

export function getChunkVersion(
  manifest: PokemonCatalogManifest | null | undefined,
  chunk: Exclude<PokemonChunkName, 'pokemonFull'>,
): string | null {
  const version = manifest?.chunks?.[chunk]?.version;
  return typeof version === 'string' && version.trim() ? version : null;
}

function getPokemonCatalogEndpoint(manifest?: PokemonCatalogManifest | null): string {
  return getChunkEndpoint(manifest, 'catalog', pokemonContract.endpoints.pokemons);
}

async function getPokemonChunk<T>(
  manifest: PokemonCatalogManifest,
  chunk: Exclude<PokemonChunkName, 'pokemonFull' | 'catalog' | 'pvpData'>,
): Promise<T | null> {
  if (!manifest.chunks?.[chunk]) return null;

  const endpoint = getChunkEndpoint(manifest, chunk, '');
  if (!endpoint) return null;

  const requestUrl = buildUrl(BASE_URL, endpoint);

  for (let attempt = 1; attempt <= POKEMON_CHUNK_REQUEST_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await requestWithPolicy(requestUrl, {
        method: 'GET',
        headers: {},
      });
    } catch (error) {
      if (attempt < POKEMON_CHUNK_REQUEST_ATTEMPTS) continue;
      throw error;
    }

    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      const canRetry = response.status === 408 || response.status === 429 || response.status >= 500;
      if (canRetry && attempt < POKEMON_CHUNK_REQUEST_ATTEMPTS) continue;
      throw toHttpError(response.status, payload);
    }
    if (!Array.isArray(payload)) {
      throw new Error(`[pokemonDataService] invalid ${chunk} chunk shape: expected array`);
    }

    return normalizeAssetUrlsDeep(payload as T);
  }

  return null;
}

async function getPokemonObjectChunk<T>(
  manifest: PokemonCatalogManifest,
  chunk: 'pvpData',
): Promise<T | null> {
  if (!manifest.chunks?.[chunk]) return null;

  const endpoint = getChunkEndpoint(manifest, chunk, '');
  if (!endpoint) return null;

  const requestUrl = buildUrl(BASE_URL, endpoint);
  for (let attempt = 1; attempt <= POKEMON_CHUNK_REQUEST_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      response = await requestWithPolicy(requestUrl, {
        method: 'GET',
        headers: {},
      });
    } catch (error) {
      if (attempt < POKEMON_CHUNK_REQUEST_ATTEMPTS) continue;
      throw error;
    }

    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      const canRetry = response.status === 408 || response.status === 429 || response.status >= 500;
      if (canRetry && attempt < POKEMON_CHUNK_REQUEST_ATTEMPTS) continue;
      throw toHttpError(response.status, payload);
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error(`[pokemonDataService] invalid ${chunk} chunk shape: expected object`);
    }

    return normalizeAssetUrlsDeep(payload as T);
  }

  return null;
}

export const getPokemons = async (options: GetPokemonsOptions = {}): Promise<Pokemons> => {
  try {
    clearStaleLocalStorageCache();

    const response = await requestWithPolicy(buildUrl(BASE_URL, getPokemonCatalogEndpoint(options.manifest)), {
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

export const getPokemonMovesChunk = async (
  manifest: PokemonCatalogManifest,
): Promise<PokemonMovesChunk | null> => {
  try {
    return await getPokemonChunk<PokemonMovesChunk>(manifest, 'moves');
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon moves chunk', error);
    throw error;
  }
};

export const getPokemonRaidDataChunk = async (
  manifest: PokemonCatalogManifest,
): Promise<PokemonRaidDataChunk | null> => {
  try {
    return await getPokemonChunk<PokemonRaidDataChunk>(manifest, 'raidData');
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon raid-data chunk', error);
    throw error;
  }
};

export const getPokemonMaxDataChunk = async (
  manifest: PokemonCatalogManifest,
): Promise<Pokemons | null> => {
  try {
    return await getPokemonChunk<Pokemons>(manifest, 'maxData');
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon Max Battle chunk', error);
    throw error;
  }
};

export const getPokemonPvPDataChunk = async (
  manifest: PokemonCatalogManifest,
): Promise<PokemonPvPRankingsPayload | null> => {
  try {
    return await getPokemonObjectChunk<PokemonPvPRankingsPayload>(manifest, 'pvpData');
  } catch (error: unknown) {
    log.error('Error fetching the Pokemon PvP rankings chunk', error);
    throw error;
  }
};

export const simulatePokemonPvPBattle = async (
  request: PokemonPvPBattleRequest,
): Promise<PokemonPvPBattleResponse> => {
  try {
    const response = await requestWithPolicy(
      buildUrl(BASE_URL, pokemonContract.endpoints.pvpBattle),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );
    const payload = await parseJsonSafe<unknown>(response);
    if (!response.ok) {
      const message =
        payload &&
        typeof payload === 'object' &&
        typeof (payload as { error?: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : 'Battle simulation failed.';
      throw toHttpError(response.status, payload, message);
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      !Array.isArray((payload as { fighters?: unknown }).fighters) ||
      !Array.isArray((payload as { ratings?: unknown }).ratings)
    ) {
      throw new Error(
        '[pokemonDataService] invalid PvP battle response shape',
      );
    }
    return payload as PokemonPvPBattleResponse;
  } catch (error: unknown) {
    log.error('Error simulating the PvP battle', error);
    throw error;
  }
};

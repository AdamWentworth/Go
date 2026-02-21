import { buildUrl } from '@pokemongonexus/shared-contracts/common';
import { searchContract, type SearchQueryParams, type SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import { runtimeConfig } from '../config/runtimeConfig';
import { getAuthToken } from '../features/auth/authSession';
import { parseJsonSafe } from './httpClient';

const buildSearchUrl = (queryParams: SearchQueryParams): string =>
  buildUrl(runtimeConfig.api.searchApiUrl, searchContract.endpoints.searchPokemon, queryParams);

export const searchPokemon = async (
  queryParams: SearchQueryParams,
): Promise<SearchResultRow[]> => {
  const authToken = getAuthToken();
  const response = await fetch(buildSearchUrl(queryParams), {
    method: 'GET',
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const payload = await parseJsonSafe<SearchResultRow[] | Record<string, SearchResultRow>>(response);
  if (!response.ok) {
    throw new Error(`Search failed (${response.status})`);
  }
  if (!payload) return [];
  return Array.isArray(payload) ? payload : Object.values(payload);
};


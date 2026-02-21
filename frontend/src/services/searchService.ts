import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';
import type {
  SearchQueryParams,
  SearchResultRow,
} from '@shared-contracts/search';
import { searchContract } from '@shared-contracts/search';
export type { SearchQueryParams, SearchResultRow } from '@shared-contracts/search';

const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL;

export async function searchPokemon(
  queryParams: SearchQueryParams,
): Promise<SearchResultRow[]> {
  const response = await requestWithPolicy(
    buildUrl(SEARCH_API_URL, searchContract.endpoints.searchPokemon, queryParams),
    {
      method: 'GET',
    },
  );

  const payload = await parseJsonSafe<
    SearchResultRow[] | Record<string, SearchResultRow>
  >(response);

  if (!response.ok) {
    throw toHttpError(response.status, payload);
  }

  if (!payload) {
    return [];
  }

  return Array.isArray(payload) ? payload : Object.values(payload);
}

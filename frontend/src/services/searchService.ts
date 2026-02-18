import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from './httpClient';

export type SearchQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type SearchResultRow = {
  pokemon_id?: number;
  distance?: number;
  [key: string]: unknown;
};

const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL;

export async function searchPokemon(
  queryParams: SearchQueryParams,
): Promise<SearchResultRow[]> {
  const response = await requestWithPolicy(
    buildUrl(SEARCH_API_URL, '/searchPokemon', queryParams),
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

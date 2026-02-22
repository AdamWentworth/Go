import { buildUrl } from '@pokemongonexus/shared-contracts/common';
import { locationContract } from '@pokemongonexus/shared-contracts/location';
import { runtimeConfig } from '../config/runtimeConfig';
import { parseJsonSafe } from './httpClient';

type LocationAutocompleteRow = {
  id?: number;
  name?: string;
  state_or_province?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type LocationAutocompleteResult = {
  displayName: string;
  latitude: number | null;
  longitude: number | null;
};

const buildDisplayName = (row: LocationAutocompleteRow): string => {
  const parts: string[] = [];
  if (row.name) parts.push(row.name);
  if (row.state_or_province) parts.push(row.state_or_province);
  if (row.country) parts.push(row.country);
  return parts.join(', ') || 'Unknown location';
};

export const MIN_LOCATION_QUERY_LENGTH = 3;

export const fetchLocationSuggestions = async (
  query: string,
): Promise<LocationAutocompleteResult[]> => {
  if (query.trim().length < MIN_LOCATION_QUERY_LENGTH) return [];
  const url = buildUrl(runtimeConfig.api.locationApiUrl, locationContract.endpoints.autocomplete, {
    query,
  });
  const response = await fetch(url);
  if (!response.ok) return [];
  const payload = await parseJsonSafe<LocationAutocompleteRow[]>(response);
  if (!payload || !Array.isArray(payload)) return [];
  return payload.map((row) => ({
    displayName: buildDisplayName(row),
    latitude: typeof row.latitude === 'number' ? row.latitude : null,
    longitude: typeof row.longitude === 'number' ? row.longitude : null,
  }));
};

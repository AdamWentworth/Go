import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import { buildNativeCollectionRows, type NativeCollectionRow } from '../collection/collectionModel';

export type NativePokemonSearchMode = 'caught' | 'trade' | 'wanted';

export type NativePokemonSearchRelatedRow = NativeCollectionRow & {
  match: boolean;
};

export type NativePokemonSearchResult = {
  id: string;
  username: string;
  distanceKm: number | null;
  mode: NativePokemonSearchMode;
  row: NativeCollectionRow;
  relatedRows: NativePokemonSearchRelatedRow[];
  hasMutualMatch: boolean;
};

type RawSearchListing = SearchResultRow & Partial<PokemonInstance> & {
  instance_id?: string;
  username?: string;
  wanted_list?: Record<string, unknown> | null;
  trade_list?: Record<string, unknown> | null;
};

const recordEntries = (value: unknown): [string, Record<string, unknown>][] => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, entry]) => (
    entry && typeof entry === 'object' && !Array.isArray(entry)
      ? [[key, entry as Record<string, unknown>]]
      : []
  ));
};

const ensureStatus = (
  listing: Record<string, unknown>,
  mode: NativePokemonSearchMode,
): PokemonInstance => ({
  ...listing,
  is_caught: mode === 'caught' || mode === 'trade',
  is_for_trade: mode === 'trade',
  is_wanted: mode === 'wanted',
} as PokemonInstance);

const rowForInstance = ({
  assetOrigin,
  catalog,
  id,
  instance,
  mode,
}: {
  assetOrigin: string;
  catalog: BasePokemon[];
  id: string;
  instance: Record<string, unknown>;
  mode: NativePokemonSearchMode;
}): NativeCollectionRow | null => buildNativeCollectionRows(
  { [id]: ensureStatus({ ...instance, instance_id: id }, mode) },
  catalog,
  assetOrigin,
)[0] ?? null;

export const buildNativePokemonSearchResults = ({
  assetOrigin,
  catalog,
  mode,
  results,
}: {
  assetOrigin: string;
  catalog: BasePokemon[];
  mode: NativePokemonSearchMode;
  results: SearchResultRow[];
}): NativePokemonSearchResult[] => {
  const mapped = results.flatMap<NativePokemonSearchResult>((raw) => {
    const listing = raw as RawSearchListing;
    const id = listing.instance_id?.trim();
    if (!id) return [];
    const row = rowForInstance({ assetOrigin, catalog, id, instance: listing, mode });
    if (!row) return [];

    const relatedMode: NativePokemonSearchMode = mode === 'trade' ? 'wanted' : 'trade';
    const relatedSource = mode === 'trade' ? listing.wanted_list : listing.trade_list;
    const relatedRows = mode === 'caught' ? [] : recordEntries(relatedSource).flatMap(
      ([relatedId, related]) => {
        const relatedRow = rowForInstance({
          assetOrigin,
          catalog,
          id: relatedId,
          instance: related,
          mode: relatedMode,
        });
        return relatedRow ? [{
          ...relatedRow,
          match: related.match === true,
        }] : [];
      },
    );
    const distance = Number(listing.distance);
    return [{
      id,
      username: listing.username?.trim() || 'Unknown trainer',
      distanceKm: Number.isFinite(distance) ? distance : null,
      mode,
      row,
      relatedRows: relatedRows.sort((left, right) => (
        Number(right.match) - Number(left.match)
        || left.pokedexNumber - right.pokedexNumber
        || left.name.localeCompare(right.name)
      )),
      hasMutualMatch: relatedRows.some((related) => related.match),
    }];
  });

  return mapped.sort((left, right) => (
    Number(right.hasMutualMatch) - Number(left.hasMutualMatch)
    || (left.distanceKm ?? Number.POSITIVE_INFINITY)
      - (right.distanceKm ?? Number.POSITIVE_INFINITY)
    || left.username.localeCompare(right.username)
  ));
};

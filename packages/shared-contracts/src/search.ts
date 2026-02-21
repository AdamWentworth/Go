export type SearchQueryParamValue = string | number | boolean | null | undefined;

export type SearchQueryParams = Record<string, SearchQueryParamValue>;

export type SearchResultRow = {
  pokemon_id?: number;
  distance?: number;
  [key: string]: unknown;
};

export const searchContract = {
  endpoints: {
    searchPokemon: '/searchPokemon',
  },
} as const;

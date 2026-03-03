import type { OwnershipMode } from './domain';

export type SearchQueryParamValue = string | number | boolean | null | undefined;

export type SearchQueryParams = Record<string, SearchQueryParamValue>;

export type SearchResultRow = {
  pokemon_id?: number;
  distance?: number;
  [key: string]: unknown;
};

export interface PokemonSearchQueryParams extends SearchQueryParams {
  pokemon_id: number;
  shiny: boolean;
  shadow: boolean;
  costume_id: number | null;
  fast_move_id: number | '' | null;
  charged_move_1_id: number | '' | null;
  charged_move_2_id: number | '' | null;
  gender: string | null;
  background_id: number | null;
  attack_iv: number | null;
  defense_iv: number | null;
  stamina_iv: number | null;
  only_matching_trades: boolean | null;
  pref_lucky: boolean | null;
  friendship_level: number | null;
  already_registered: boolean | null;
  trade_in_wanted_list: boolean | null;
  latitude: number | null;
  longitude: number | null;
  ownership: OwnershipMode;
  range_km: number;
  limit: number;
  dynamax: boolean;
  gigantamax: boolean;
}

export const searchContract = {
  endpoints: {
    searchPokemon: '/searchPokemon',
  },
} as const;

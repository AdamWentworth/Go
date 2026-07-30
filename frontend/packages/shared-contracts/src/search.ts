import type { OwnershipMode } from './domain';

export type SearchQueryParamValue = string | number | boolean | null | undefined;

export type SearchQueryParams = Record<string, SearchQueryParamValue>;

export type SearchResultRow = {
  pokemon_id?: number;
  distance?: number;
  [key: string]: unknown;
};

export interface PokemonCommunityRanking {
  variant_id: string;
  wanted_users: number | null;
  most_wanted_users: number | null;
  caught_users: number;
}

export interface PokemonCommunityRankingsPayload {
  privacy_threshold: number;
  snapshot: {
    collector_users: number;
    wishlist_users: number;
    updated_at: string;
  };
  most_wanted: PokemonCommunityRanking[];
  rarest: PokemonCommunityRanking[];
}

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

export type TradeMatchSourceType = 'trade' | 'wanted';
export type TradeMatchBlocker =
  | 'not_friends'
  | 'outside_trade_range'
  | 'active_trade_conflict'
  | 'privacy_restricted'
  | 'ownership_changed';

export interface TradeMatchQueryParams extends SearchQueryParams {
  source_type?: TradeMatchSourceType;
  source_instance_id?: string;
  candidate_instance_id?: string;
  cursor?: string;
  limit?: number;
  latitude?: number;
  longitude?: number;
  range_km?: number;
  friendship?: 'all' | 'friends';
  special_trade?: boolean;
}

export interface TradeMatchPokemonSummary {
  instance_id: string;
  variant_id?: string | null;
  pokemon_id: number;
  nickname?: string | null;
  cp?: number | null;
  shiny: boolean;
  costume_id?: number | null;
  lucky: boolean;
  shadow: boolean;
  dynamax: boolean;
  gigantamax: boolean;
}

export interface TradeMatchTrainerSummary {
  user_id: string;
  username: string;
  distance_km?: number | null;
  is_friend: boolean;
  friendship_level?: number | null;
}

export interface TradeMatchCard {
  match_id: string;
  my_offer: TradeMatchPokemonSummary;
  my_wanted: TradeMatchPokemonSummary;
  their_offer: TradeMatchPokemonSummary;
  their_wanted: TradeMatchPokemonSummary;
  trainer: TradeMatchTrainerSummary;
  match_reasons: string[];
  is_special_trade: boolean;
  is_registered_trade: boolean;
  eligibility: {
    can_propose: boolean;
    blockers: TradeMatchBlocker[];
  };
}

export interface TradeMatchFeed {
  matches: TradeMatchCard[];
  next_cursor?: string;
}

export const searchContract = {
  endpoints: {
    searchPokemon: '/searchPokemon',
    tradeMatches: '/trade-matches',
    rankings: '/rankings',
  },
} as const;

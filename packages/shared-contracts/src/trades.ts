export const tradesContract = {
  endpoints: {
    revealPartnerInfo: '/reveal-partner-info',
  },
} as const;

export interface TradeRecord {
  trade_id?: string;
  trade_status: string;
  pokemon_instance_id_user_proposed?: string | null;
  pokemon_instance_id_user_accepting?: string | null;
  trade_deleted_date?: string;
  last_update?: number | string | null;
  [key: string]: unknown;
}

export interface RelatedInstanceRecord {
  instance_id: string;
  [key: string]: unknown;
}

export interface TradeReference {
  trade_id?: string;
  usernames?: string[];
  [key: string]: unknown;
}

export interface PartnerCoordinates {
  latitude: number;
  longitude: number;
}

export interface PartnerInfo {
  trainerCode?: string | null;
  pokemonGoName?: string | null;
  coordinates?: PartnerCoordinates | null;
  location?: string | null;
}

export interface RevealPartnerInfoRequest {
  trade: TradeReference;
}

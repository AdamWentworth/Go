export const tradesContract = {
  endpoints: {
    revealPartnerInfo: '/reveal-partner-info',
  },
} as const;

export interface TradeReference {
  trade_id?: string;
  usernames?: string[];
  [key: string]: unknown;
}

export interface PartnerInfo {
  trainerCode?: string | null;
  pokemonGoName?: string | null;
  location?: string | null;
}

export interface RevealPartnerInfoRequest {
  trade: TradeReference;
}

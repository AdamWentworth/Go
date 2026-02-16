export const TRADE_STATUS_FILTERS = [
  'Accepting',
  'Proposed',
  'Pending',
  'Completed',
  'Cancelled',
] as const;

export type TradeStatusFilter = (typeof TRADE_STATUS_FILTERS)[number];

export interface TradeListTrade {
  trade_id?: string;
  trade_status?: string | null;
  username_proposed?: string | null;
  username_accepting?: string | null;
  [key: string]: unknown;
}

export type TradeMap = Record<string, TradeListTrade>;
export type RelatedInstancesMap = Record<string, unknown>;

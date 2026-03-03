import type { RelatedInstanceRecord, TradeRecord } from '@shared-contracts/trades';

export const TRADE_STATUS_FILTERS = [
  'Accepting',
  'Proposed',
  'Pending',
  'Completed',
  'Cancelled',
] as const;

export type TradeStatusFilter = (typeof TRADE_STATUS_FILTERS)[number];

export type TradeListTrade = TradeRecord;

export type TradeMap = Record<string, TradeListTrade>;
export type RelatedInstancesMap = Record<string, RelatedInstanceRecord>;

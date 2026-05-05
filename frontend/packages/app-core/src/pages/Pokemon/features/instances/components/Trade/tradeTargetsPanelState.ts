export interface TradeTargetsPanelListsState {
  wanted: Record<string, unknown>;
  [key: string]: unknown;
}

export type TradeTargetsPanelCopy = {
  eyebrow: string;
  title: string;
  description: string;
  listTitle: string;
};

export const normalizeTradeTargetEntries = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

export const normalizeListsState = (
  value: Record<string, Record<string, unknown>>,
): TradeTargetsPanelListsState => ({
  ...value,
  wanted: normalizeTradeTargetEntries(value.wanted),
});

export const resolveTradeTargetsPanelCopy = (isMirror: boolean): TradeTargetsPanelCopy =>
  isMirror
    ? {
        eyebrow: 'Mirror Trade',
        title: 'Mirror Match',
        description: 'Review the mirrored partner that matches this offer.',
        listTitle: 'Available Mirror',
      }
    : {
        eyebrow: 'Desired Return',
        title: 'Trade Targets',
        description:
          'Choose the Pokemon you would accept for this trade and fine-tune the filters below.',
        listTitle: 'Target List',
      };

export type TradeAction = 'accept' | 'deny' | 'cancel' | 'complete' | 'repropose' | 'delete';

const ACTIONS_BY_STATUS: Record<string, TradeAction[]> = {
  proposed: ['accept', 'deny', 'cancel', 'delete'],
  pending: ['complete', 'cancel'],
  denied: ['repropose', 'delete'],
  cancelled: ['repropose', 'delete'],
  completed: ['delete'],
  deleted: ['repropose'],
};

export const getAllowedTradeActions = (status: string | null | undefined): TradeAction[] => {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  return ACTIONS_BY_STATUS[normalized] ?? [];
};

export const isTradeActionAllowed = (
  status: string | null | undefined,
  action: TradeAction,
): boolean => getAllowedTradeActions(status).includes(action);

export const buildAllowedActionLabel = (status: string | null | undefined): string => {
  const allowed = getAllowedTradeActions(status);
  if (allowed.length === 0) return 'No actions available for this status.';
  return `Allowed actions: ${allowed.join(', ')}`;
};

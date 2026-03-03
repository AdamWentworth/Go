export type TradeAction =
  | 'accept'
  | 'deny'
  | 'cancel'
  | 'complete'
  | 'repropose'
  | 'delete'
  | 'satisfaction';
export type TradeActionDecision = { allowed: boolean; reason: string | null };

type TradeActionContext = {
  viewerUsername?: string | null;
  trade?: {
    username_proposed?: string | null;
    username_accepting?: string | null;
    user_proposed_completion_confirmed?: boolean | null;
    user_accepting_completion_confirmed?: boolean | null;
  } | null;
};

const ACTIONS_BY_STATUS: Record<string, TradeAction[]> = {
  proposed: ['accept', 'deny', 'cancel', 'delete'],
  pending: ['complete', 'cancel'],
  denied: ['repropose', 'delete'],
  cancelled: ['repropose', 'delete'],
  completed: ['delete', 'satisfaction'],
  deleted: ['repropose'],
};

export const getAllowedTradeActions = (status: string | null | undefined): TradeAction[] => {
  const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';
  return ACTIONS_BY_STATUS[normalized] ?? [];
};

const ACTION_LABELS: Record<TradeAction, string> = {
  accept: 'accept',
  deny: 'deny',
  cancel: 'cancel',
  complete: 'complete',
  repropose: 're-propose',
  delete: 'delete',
  satisfaction: 'satisfaction',
};

const REQUIRED_STATUS_BY_ACTION: Record<TradeAction, string[]> = {
  accept: ['proposed'],
  deny: ['proposed'],
  cancel: ['proposed', 'pending'],
  complete: ['pending'],
  repropose: ['denied', 'cancelled', 'deleted'],
  delete: ['proposed', 'denied', 'cancelled', 'completed'],
  satisfaction: ['completed'],
};

export const isTradeActionAllowed = (
  status: string | null | undefined,
  action: TradeAction,
): boolean => getAllowedTradeActions(status).includes(action);

const buildStatusRequirementReason = (action: TradeAction): string => {
  const required = REQUIRED_STATUS_BY_ACTION[action];
  return `${ACTION_LABELS[action]}: available only when status is ${required.join('/')}.\n`;
};

export const evaluateTradeAction = (
  status: string | null | undefined,
  action: TradeAction,
  context?: TradeActionContext,
): TradeActionDecision => {
  if (!isTradeActionAllowed(status, action)) {
    return { allowed: false, reason: buildStatusRequirementReason(action).trim() };
  }

  if (action === 'complete') {
    const trade = context?.trade;
    const viewer = context?.viewerUsername ?? null;
    if (!trade || !viewer) {
      return { allowed: false, reason: 'complete: unable to determine participant identity.' };
    }

    const isProposer = viewer === (trade.username_proposed ?? '');
    const isAccepter = viewer === (trade.username_accepting ?? '');
    if (!isProposer && !isAccepter) {
      return { allowed: false, reason: 'complete: only trade participants can confirm completion.' };
    }
    if (isProposer && Boolean(trade.user_proposed_completion_confirmed)) {
      return { allowed: false, reason: 'complete: you already confirmed completion.' };
    }
    if (isAccepter && Boolean(trade.user_accepting_completion_confirmed)) {
      return { allowed: false, reason: 'complete: you already confirmed completion.' };
    }
  }

  if (action === 'satisfaction') {
    const trade = context?.trade;
    const viewer = context?.viewerUsername ?? null;
    if (!trade || !viewer) {
      return { allowed: false, reason: 'satisfaction: unable to determine participant identity.' };
    }

    const isProposer = viewer === (trade.username_proposed ?? '');
    const isAccepter = viewer === (trade.username_accepting ?? '');
    if (!isProposer && !isAccepter) {
      return { allowed: false, reason: 'satisfaction: only trade participants can rate this trade.' };
    }
  }

  return { allowed: true, reason: null };
};

export const buildUnavailableTradeActionHints = (
  status: string | null | undefined,
  context?: TradeActionContext,
): string[] =>
  (Object.keys(ACTION_LABELS) as TradeAction[])
    .map((action) => evaluateTradeAction(status, action, context))
    .filter((decision) => !decision.allowed && Boolean(decision.reason))
    .map((decision) => decision.reason as string);

export const buildAllowedActionLabel = (status: string | null | undefined): string => {
  const allowed = getAllowedTradeActions(status);
  if (allowed.length === 0) return 'No actions available for this status.';
  return `Allowed actions: ${allowed.join(', ')}`;
};

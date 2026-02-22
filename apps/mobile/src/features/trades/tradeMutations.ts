import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';

export type TradeRow = TradeRecord & {
  trade_id: string;
  trade_status: string;
  username_proposed?: string | null;
  username_accepting?: string | null;
  pokemon_instance_id_user_proposed?: string | null;
  pokemon_instance_id_user_accepting?: string | null;
};

export type TradeMap = Record<string, TradeRow>;

const nowIso = (): string => new Date().toISOString();
const nowMs = (): number => Date.now();

export const toTradeMap = (rows: TradeRow[]): TradeMap =>
  rows.reduce<TradeMap>((acc, row) => {
    acc[row.trade_id] = row;
    return acc;
  }, {});

export const toTradeRows = (tradeMap: TradeMap): TradeRow[] =>
  Object.values(tradeMap).sort((a, b) => {
    const aRaw = a.last_update;
    const bRaw = b.last_update;
    const aTime =
      typeof aRaw === 'number' ? aRaw : typeof aRaw === 'string' ? new Date(aRaw).getTime() : 0;
    const bTime =
      typeof bRaw === 'number' ? bRaw : typeof bRaw === 'string' ? new Date(bRaw).getTime() : 0;
    return bTime - aTime;
  });

export const buildStatusCounts = (rows: TradeRow[]): Record<string, number> =>
  rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.trade_status || 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

export const acceptTrade = (
  trades: TradeMap,
  tradeId: string,
): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const updated: TradeRow = {
    ...source,
    trade_status: 'pending',
    trade_accepted_date: nowIso(),
    last_update: nowMs(),
  };

  const next: TradeMap = { ...trades, [tradeId]: updated };
  const changed: TradeRow[] = [updated];
  const accepting = updated.pokemon_instance_id_user_accepting ?? null;
  const proposed = updated.pokemon_instance_id_user_proposed ?? null;

  for (const [id, row] of Object.entries(trades)) {
    if (id === tradeId || row.trade_status !== 'proposed') continue;
    const clash =
      row.pokemon_instance_id_user_accepting === accepting ||
      row.pokemon_instance_id_user_accepting === proposed ||
      row.pokemon_instance_id_user_proposed === accepting ||
      row.pokemon_instance_id_user_proposed === proposed;
    if (!clash) continue;

    const deleted: TradeRow = {
      ...row,
      trade_status: 'deleted',
      trade_deleted_date: nowIso(),
      last_update: nowMs(),
    };
    next[id] = deleted;
    changed.push(deleted);
  }

  return { next, changed };
};

export const denyTrade = (trades: TradeMap, tradeId: string): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const updated: TradeRow = {
    ...source,
    trade_status: 'denied',
    trade_deleted_date: nowIso(),
    last_update: nowMs(),
  };
  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

export const cancelTrade = (
  trades: TradeMap,
  tradeId: string,
  cancelledBy: string,
): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const updated: TradeRow = {
    ...source,
    trade_status: 'cancelled',
    trade_cancelled_date: nowIso(),
    trade_cancelled_by: cancelledBy,
    last_update: nowMs(),
  };
  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

export const reproposeTrade = (
  trades: TradeMap,
  tradeId: string,
  currentUsername: string,
): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const originalProposer = source.username_proposed ?? '';
  const originalAccepter = source.username_accepting ?? '';
  let nextProposer = originalProposer;
  let nextAccepter = originalAccepter;

  if (currentUsername && currentUsername !== originalProposer) {
    nextProposer = currentUsername;
    nextAccepter = originalProposer;
  }

  const updated: TradeRow = {
    ...source,
    trade_status: 'proposed',
    username_proposed: nextProposer,
    username_accepting: nextAccepter,
    trade_accepted_date: null,
    trade_completed_date: null,
    trade_cancelled_date: null,
    trade_cancelled_by: null,
    trade_deleted_date: null,
    user_proposed_completion_confirmed: false,
    user_accepting_completion_confirmed: false,
    user_1_trade_satisfaction: null,
    user_2_trade_satisfaction: null,
    trade_proposal_date: nowIso(),
    last_update: nowMs(),
  };
  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

export const deleteTrade = (trades: TradeMap, tradeId: string): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };
  const updated: TradeRow = {
    ...source,
    trade_status: 'deleted',
    trade_deleted_date: nowIso(),
    last_update: nowMs(),
  };
  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

export const completeTrade = (
  trades: TradeMap,
  tradeId: string,
  currentUsername: string,
): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const isProposer = currentUsername === source.username_proposed;
  const updated: TradeRow = {
    ...source,
    [isProposer ? 'user_proposed_completion_confirmed' : 'user_accepting_completion_confirmed']:
      true,
    last_update: nowMs(),
  };

  const bothConfirmed = Boolean(
    updated.user_proposed_completion_confirmed && updated.user_accepting_completion_confirmed,
  );
  if (bothConfirmed) {
    updated.trade_status = 'completed';
    updated.trade_completed_date = nowIso();
  }

  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

export const setTradeSatisfaction = (
  trades: TradeMap,
  tradeId: string,
  currentUsername: string,
): { next: TradeMap; changed: TradeRow[] } => {
  const source = trades[tradeId];
  if (!source) return { next: trades, changed: [] };

  const proposer = source.username_proposed ?? '';
  const accepter = source.username_accepting ?? '';
  const isProposer = currentUsername.length > 0 && currentUsername === proposer;
  const isAccepter = currentUsername.length > 0 && currentUsername === accepter;
  if (!isProposer && !isAccepter) {
    return { next: trades, changed: [] };
  }

  const proposerSatisfaction = Boolean(source.user_1_trade_satisfaction);
  const accepterSatisfaction = Boolean(source.user_2_trade_satisfaction);
  const updated: TradeRow = {
    ...source,
    ...(isProposer
      ? { user_1_trade_satisfaction: !proposerSatisfaction }
      : { user_2_trade_satisfaction: !accepterSatisfaction }),
    last_update: nowMs(),
  };

  return {
    next: { ...trades, [tradeId]: updated },
    changed: [updated],
  };
};

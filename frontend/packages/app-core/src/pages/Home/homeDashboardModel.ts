import type { Trade } from '@/features/trades/store/useTradeStore';
import type { PokemonInstance } from '@/types/pokemonInstance';

export interface HomeCollectionSummary {
  caught: number;
  favorites: number;
  forTrade: number;
  wanted: number;
  mostWanted: number;
}

export interface HomeTradeSummary {
  needsResponse: number;
  readyToConfirm: number;
  waiting: number;
  completed: number;
  active: number;
}

const normalizedStatus = (trade: Trade): string =>
  String(trade.trade_status ?? '').toLowerCase();

const isCurrentUser = (
  candidate: string | null | undefined,
  username: string,
): boolean => candidate?.toLowerCase() === username.toLowerCase();

export const summarizeHomeCollection = (
  instances: Record<string, PokemonInstance>,
): HomeCollectionSummary => {
  const summary: HomeCollectionSummary = {
    caught: 0,
    favorites: 0,
    forTrade: 0,
    wanted: 0,
    mostWanted: 0,
  };

  Object.values(instances).forEach((instance) => {
    if (instance.is_caught) summary.caught += 1;
    if (instance.is_caught && instance.favorite) summary.favorites += 1;
    if (instance.is_caught && instance.is_for_trade) summary.forTrade += 1;
    if (instance.is_wanted) summary.wanted += 1;
    if (instance.is_wanted && instance.most_wanted) summary.mostWanted += 1;
  });

  return summary;
};

export const summarizeHomeTrades = (
  trades: Record<string, Trade>,
  username: string,
): HomeTradeSummary => {
  const summary: HomeTradeSummary = {
    needsResponse: 0,
    readyToConfirm: 0,
    waiting: 0,
    completed: 0,
    active: 0,
  };

  Object.values(trades).forEach((trade) => {
    const status = normalizedStatus(trade);

    if (status === 'completed') {
      summary.completed += 1;
      return;
    }

    if (status === 'proposed') {
      summary.active += 1;
      if (isCurrentUser(trade.username_accepting, username)) {
        summary.needsResponse += 1;
      } else if (isCurrentUser(trade.username_proposed, username)) {
        summary.waiting += 1;
      }
      return;
    }

    if (status !== 'pending') return;

    summary.active += 1;
    const proposedUser = isCurrentUser(trade.username_proposed, username);
    const acceptingUser = isCurrentUser(trade.username_accepting, username);
    const currentUserConfirmed = proposedUser
      ? trade.user_proposed_completion_confirmed === true
      : acceptingUser
        ? trade.user_accepting_completion_confirmed === true
        : true;

    if (currentUserConfirmed) summary.waiting += 1;
    else summary.readyToConfirm += 1;
  });

  return summary;
};

export const getRecentHomeInstances = (
  instances: Record<string, PokemonInstance>,
  limit = 4,
): PokemonInstance[] =>
  Object.entries(instances)
    .filter(([, instance]) => instance.is_caught || instance.is_wanted)
    .sort(([, left], [, right]) => {
      const updated = Number(right.last_update ?? 0) - Number(left.last_update ?? 0);
      if (updated !== 0) return updated;
      return String(right.date_added ?? '').localeCompare(String(left.date_added ?? ''));
    })
    .slice(0, limit)
    .map(([instanceId, instance]) => ({
      ...instance,
      instance_id: instance.instance_id || instanceId,
    }));

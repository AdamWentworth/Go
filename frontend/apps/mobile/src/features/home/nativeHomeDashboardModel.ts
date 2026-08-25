import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import type { NativeCollectionRow } from '../collection/collectionModel';

export type NativeHomeCollectionSummary = {
  caught: number;
  favorites: number;
  forTrade: number;
  wanted: number;
  mostWanted: number;
};

export type NativeHomeTradeSummary = {
  needsResponse: number;
  readyToConfirm: number;
  waiting: number;
  completed: number;
  active: number;
};

export const EMPTY_NATIVE_HOME_COLLECTION: NativeHomeCollectionSummary = {
  caught: 0,
  favorites: 0,
  forTrade: 0,
  wanted: 0,
  mostWanted: 0,
};

export const EMPTY_NATIVE_HOME_TRADES: NativeHomeTradeSummary = {
  needsResponse: 0,
  readyToConfirm: 0,
  waiting: 0,
  completed: 0,
  active: 0,
};

const isCurrentUser = (
  candidate: string | null | undefined,
  username: string,
): boolean => candidate?.toLocaleLowerCase() === username.toLocaleLowerCase();

export const summarizeNativeHomeCollection = (
  instances: Record<string, PokemonInstance>,
): NativeHomeCollectionSummary => Object.values(instances).reduce<NativeHomeCollectionSummary>(
  (summary, instance) => ({
    caught: summary.caught + (instance.is_caught ? 1 : 0),
    favorites: summary.favorites + (instance.is_caught && instance.favorite ? 1 : 0),
    forTrade: summary.forTrade + (instance.is_caught && instance.is_for_trade ? 1 : 0),
    wanted: summary.wanted + (instance.is_wanted ? 1 : 0),
    mostWanted: summary.mostWanted + (instance.is_wanted && instance.most_wanted ? 1 : 0),
  }),
  { ...EMPTY_NATIVE_HOME_COLLECTION },
);

export const summarizeNativeHomeTrades = (
  trades: TradeRecord[],
  username: string,
): NativeHomeTradeSummary => trades.reduce<NativeHomeTradeSummary>((summary, trade) => {
  const status = String(trade.trade_status ?? '').toLocaleLowerCase();

  if (status === 'completed') {
    summary.completed += 1;
    return summary;
  }

  if (status === 'proposed') {
    summary.active += 1;
    if (isCurrentUser(trade.username_accepting, username)) summary.needsResponse += 1;
    if (isCurrentUser(trade.username_proposed, username)) summary.waiting += 1;
    return summary;
  }

  if (status !== 'pending') return summary;

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
  return summary;
}, { ...EMPTY_NATIVE_HOME_TRADES });

const instanceTimestamp = (instance: PokemonInstance): number => {
  const lastUpdate = Number(instance.last_update ?? 0);
  if (Number.isFinite(lastUpdate) && lastUpdate > 0) return lastUpdate;
  const dateAdded = Date.parse(String(instance.date_added ?? ''));
  return Number.isFinite(dateAdded) ? dateAdded : 0;
};

export const selectNativeHomeRecentRows = (
  rows: NativeCollectionRow[],
  instances: Record<string, PokemonInstance>,
  limit = 4,
): NativeCollectionRow[] => rows
  .filter((row) => row.source !== 'catalog' && Boolean(instances[row.id]))
  .sort((left, right) => (
    instanceTimestamp(instances[right.id]!) - instanceTimestamp(instances[left.id]!)
  ))
  .slice(0, Math.max(0, limit));


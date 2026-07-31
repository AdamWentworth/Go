import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type SelectedPokemon = Record<string, unknown> & {
  key?: string;
  name?: string;
  variantType?: string;
  instanceData?: Partial<PokemonInstance>;
};

export interface TradeCandidateSets {
  selectedBaseKey: string;
  hashedInstances: Instances;
  caughtInstances: PokemonInstance[];
  tradeableInstances: PokemonInstance[];
}

export type MatchedInstancePokemon = PokemonVariant & {
  instanceData: PokemonInstance;
};

export interface TradeProposalPayload {
  matchedInstances: MatchedInstancePokemon[];
  [key: string]: unknown;
}

export type TradeProposalDecision =
  | { kind: 'noCaught' }
  | {
      kind: 'needsTradeSelection';
      selectedBaseKey: string;
      caughtInstances: PokemonInstance[];
    }
  | { kind: 'noAvailableTradeable' }
  | { kind: 'proposalReady'; payload: TradeProposalPayload };

interface PendingTradeRow {
  trade_status?: string;
  pokemon_instance_id_user_proposed?: string | null;
  pokemon_instance_id_user_accepting?: string | null;
}

export const toInstanceMap = (userInstances: PokemonInstance[]): Instances =>
  userInstances.reduce((acc, item) => {
    const instanceId = String(item.instance_id ?? '');
    acc[instanceId] = item;
    return acc;
  }, {} as Instances);

export const findCaughtInstancesForBaseKey = (
  userInstances: PokemonInstance[],
  baseKey: string,
  parseVariantId: (input: string) => { baseKey: string },
): PokemonInstance[] =>
  userInstances.filter((item) => {
    const parsed = parseVariantId(String(item.instance_id ?? ''));
    return parsed.baseKey === baseKey && item.is_caught === true;
  });

export const findTradeableInstances = (
  caughtInstances: PokemonInstance[],
): PokemonInstance[] =>
  caughtInstances.filter((item) => item.is_for_trade === true);

const isPendingTrade = (trade: unknown): trade is PendingTradeRow => {
  if (!trade || typeof trade !== 'object') return false;
  const row = trade as PendingTradeRow;
  return row.trade_status === 'pending';
};

export const findAvailableTradeInstances = (
  tradeableInstances: PokemonInstance[],
  allTrades: unknown[],
): PokemonInstance[] => {
  const pendingTrades = allTrades.filter(isPendingTrade);
  return tradeableInstances.filter((instance) => {
    const instanceId = String(instance.instance_id ?? '');
    return !pendingTrades.some(
      (trade) =>
        trade.pokemon_instance_id_user_proposed === instanceId ||
        trade.pokemon_instance_id_user_accepting === instanceId,
    );
  });
};

export const buildMatchedInstancesPayload = (
  selectedPokemon: SelectedPokemon,
  availableInstances: PokemonInstance[],
): TradeProposalPayload => {
  const baseData = { ...selectedPokemon };
  delete baseData.instanceData;

  const matchedInstances = availableInstances.map((instance) => ({
    ...baseData,
    instanceData: { ...instance },
  })) as MatchedInstancePokemon[];

  return { matchedInstances };
};

export const prepareTradeCandidateSets = (
  selectedPokemon: SelectedPokemon,
  userInstances: PokemonInstance[],
  parseVariantId: (input: string) => { baseKey: string },
): TradeCandidateSets => {
  const selectedBaseKey = parseVariantId(String(selectedPokemon.key ?? '')).baseKey;
  const hashedInstances = toInstanceMap(userInstances);
  const caughtInstances = findCaughtInstancesForBaseKey(
    userInstances,
    selectedBaseKey,
    parseVariantId,
  );
  const tradeableInstances = findTradeableInstances(caughtInstances);

  return {
    selectedBaseKey,
    hashedInstances,
    caughtInstances,
    tradeableInstances,
  };
};

export const resolveTradeProposalDecision = (
  selectedPokemon: SelectedPokemon,
  selectedBaseKey: string,
  caughtInstances: PokemonInstance[],
  tradeableInstances: PokemonInstance[],
  allTrades: unknown[],
): TradeProposalDecision => {
  if (caughtInstances.length === 0) return { kind: 'noCaught' };

  if (tradeableInstances.length === 0) {
    return {
      kind: 'needsTradeSelection',
      selectedBaseKey,
      caughtInstances,
    };
  }

  const availableInstances = findAvailableTradeInstances(tradeableInstances, allTrades);
  if (availableInstances.length === 0) return { kind: 'noAvailableTradeable' };

  return {
    kind: 'proposalReady',
    payload: buildMatchedInstancesPayload(selectedPokemon, availableInstances),
  };
};

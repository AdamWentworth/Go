import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

type GenericMap = Record<string, unknown>;

export type SelectedPokemon = GenericMap & {
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

export type TradeProposalDecision =
  | { kind: 'noCaught' }
  | { kind: 'needsTradeSelection'; selectedBaseKey: string; caughtInstances: PokemonInstance[] }
  | { kind: 'noAvailableTradeable' }
  | { kind: 'proposalReady'; payload: Record<string, unknown> };

interface PendingTradeRow {
  trade_status?: string;
  pokemon_instance_id_user_proposed?: string | null;
  pokemon_instance_id_user_accepting?: string | null;
}

export const initializeSelection = (
  filterNames: string[],
  filters: Record<string, unknown>,
): boolean[] => filterNames.map((name) => !!filters[name]);

export const countVisibleWantedItems = (
  filteredWantedList: Record<string, unknown>,
  localNotWantedList: Record<string, boolean>,
): number =>
  Object.keys(filteredWantedList).filter((key) => !localNotWantedList[key]).length;

export const extractBaseKey = (instanceId: string): string => {
  const keyParts = String(instanceId).split('_');
  keyParts.pop();
  return keyParts.join('_');
};

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

export const findTradeableInstances = (caughtInstances: PokemonInstance[]): PokemonInstance[] =>
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
    const usedInPendingTrade = pendingTrades.some(
      (trade) =>
        trade.pokemon_instance_id_user_proposed === instanceId ||
        trade.pokemon_instance_id_user_accepting === instanceId,
    );
    return !usedInPendingTrade;
  });
};

export const buildMatchedInstancesPayload = (
  selectedPokemon: SelectedPokemon,
  availableInstances: PokemonInstance[],
): Record<string, unknown> => {
  const baseData = { ...selectedPokemon };
  delete baseData.instanceData;

  const matchedInstances = availableInstances.map((instance) => ({
    ...baseData,
    instanceData: { ...instance },
  }));

  return { matchedInstances };
};

export const prepareTradeCandidateSets = (
  selectedPokemon: SelectedPokemon,
  userInstances: PokemonInstance[],
  parseVariantId: (input: string) => { baseKey: string },
): TradeCandidateSets => {
  const selectedBaseKey = parseVariantId(String(selectedPokemon.key ?? '')).baseKey;
  const hashedInstances = toInstanceMap(userInstances);
  const caughtInstances = findCaughtInstancesForBaseKey(userInstances, selectedBaseKey, parseVariantId);
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
  if (caughtInstances.length === 0) {
    return { kind: 'noCaught' };
  }

  if (tradeableInstances.length === 0) {
    return {
      kind: 'needsTradeSelection',
      selectedBaseKey,
      caughtInstances,
    };
  }

  const availableInstances = findAvailableTradeInstances(tradeableInstances, allTrades);

  if (availableInstances.length === 0) {
    return { kind: 'noAvailableTradeable' };
  }

  return {
    kind: 'proposalReady',
    payload: buildMatchedInstancesPayload(selectedPokemon, availableInstances),
  };
};

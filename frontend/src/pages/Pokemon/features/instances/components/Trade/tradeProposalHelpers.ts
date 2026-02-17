import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type Primitive = string | number | boolean | null | undefined;
type SanitizedInstanceData = Record<string, Primitive>;

export type TradeProposalRequest = {
  username_proposed: string;
  username_accepting: string;
  pokemon_instance_id_user_proposed: string;
  pokemon_instance_id_user_accepting: string;
  is_special_trade: boolean;
  is_registered_trade: boolean;
  is_lucky_trade: boolean;
  trade_dust_cost: number;
  trade_friendship_level: 1 | 2 | 3 | 4;
  user_1_trade_satisfaction: null;
  user_2_trade_satisfaction: null;
  pokemon: {
    variant_id: string;
    instance_id?: string;
    instanceData: SanitizedInstanceData;
  };
  trade_acceptance_date: null;
  trade_cancelled_by: null;
  trade_cancelled_date: null;
  trade_completed_date: null;
  trade_proposal_date: string;
  trade_status: 'proposed';
  last_update: number;
};

type BuildTradeProposalRequestArgs = {
  usernameProposed: string;
  usernameAccepting: string;
  proposedInstanceId: string;
  acceptingInstanceId: string;
  isSpecialTrade: boolean;
  isRegisteredTrade: boolean;
  isLuckyTrade: boolean;
  stardustCost: number;
  friendshipLevel: 1 | 2 | 3 | 4;
  variantId: string;
  passedInInstanceId?: string;
  sanitizedInstanceData: SanitizedInstanceData;
  nowIso?: string;
  nowMs?: number;
};

type BuildTradeProposalPreflightArgs = {
  selectedMatchedInstance: PokemonVariant | null;
  friendshipLevel: number;
  usernameProposed: string | null;
};

export type TradeProposalPreflightResult =
  | {
      ok: true;
      proposedInstanceId: string;
      usernameProposed: string;
    }
  | {
      ok: false;
      error: string;
    };

export const hasInstanceData = (
  pokemon: PokemonVariant | null | undefined,
): pokemon is PokemonVariant & { instanceData: PokemonInstance } =>
  !!pokemon && !!pokemon.instanceData;

export const findMatchedInstanceById = (
  matchedInstances: PokemonVariant[],
  instanceId: string,
): PokemonVariant | null =>
  matchedInstances.find((instance) => instance.instanceData?.instance_id === instanceId) ??
  null;

export const parseUsernameFromStoredUser = (rawUser: string | null): string | null => {
  if (!rawUser) return null;
  try {
    const parsed = JSON.parse(rawUser) as { username?: unknown };
    return typeof parsed.username === 'string' && parsed.username.length > 0
      ? parsed.username
      : null;
  } catch {
    return null;
  }
};

export const sanitizeInstanceData = (
  instanceData: Partial<PokemonInstance> | undefined,
): SanitizedInstanceData =>
  Object.entries(instanceData ?? {}).reduce<SanitizedInstanceData>((acc, [key, value]) => {
    if (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      acc[key] = value;
    }
    return acc;
  }, {});

export const buildTradeProposalPreflight = ({
  selectedMatchedInstance,
  friendshipLevel,
  usernameProposed,
}: BuildTradeProposalPreflightArgs): TradeProposalPreflightResult => {
  if (!hasInstanceData(selectedMatchedInstance)) {
    return {
      ok: false,
      error: 'Please select which instance to trade.',
    };
  }

  if (friendshipLevel < 1 || friendshipLevel > 4) {
    return {
      ok: false,
      error: 'Please select a valid friendship level (1-4).',
    };
  }

  if (!usernameProposed) {
    return {
      ok: false,
      error: 'Could not determine your username. Please sign in again.',
    };
  }

  const proposedInstanceId = selectedMatchedInstance.instanceData.instance_id ?? '';
  if (!proposedInstanceId) {
    return {
      ok: false,
      error: 'Selected trade instance is missing an instance id.',
    };
  }

  return {
    ok: true,
    proposedInstanceId,
    usernameProposed,
  };
};

export const buildTradeProposalRequest = ({
  usernameProposed,
  usernameAccepting,
  proposedInstanceId,
  acceptingInstanceId,
  isSpecialTrade,
  isRegisteredTrade,
  isLuckyTrade,
  stardustCost,
  friendshipLevel,
  variantId,
  passedInInstanceId,
  sanitizedInstanceData,
  nowIso = new Date().toISOString(),
  nowMs = Date.now(),
}: BuildTradeProposalRequestArgs): TradeProposalRequest => ({
  username_proposed: usernameProposed,
  username_accepting: usernameAccepting,
  pokemon_instance_id_user_proposed: proposedInstanceId,
  pokemon_instance_id_user_accepting: acceptingInstanceId,
  is_special_trade: isSpecialTrade,
  is_registered_trade: isRegisteredTrade,
  is_lucky_trade: isLuckyTrade,
  trade_dust_cost: stardustCost,
  trade_friendship_level: friendshipLevel,
  user_1_trade_satisfaction: null,
  user_2_trade_satisfaction: null,
  pokemon: {
    variant_id: variantId,
    instance_id: passedInInstanceId,
    instanceData: sanitizedInstanceData,
  },
  trade_acceptance_date: null,
  trade_cancelled_by: null,
  trade_cancelled_date: null,
  trade_completed_date: null,
  trade_proposal_date: nowIso,
  trade_status: 'proposed',
  last_update: nowMs,
});

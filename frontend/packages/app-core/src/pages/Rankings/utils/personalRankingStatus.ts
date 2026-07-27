import type { Instances } from '@/types/instances';

export type PersonalRankingFilter =
  | 'all'
  | 'owned'
  | 'available'
  | 'trade'
  | 'wanted'
  | 'missing';

export interface PersonalRankingStatus {
  instanceIDs: string[];
  caughtInstanceIDs: string[];
  tradeInstanceIDs: string[];
  caughtCount: number;
  tradeCount: number;
  availableCount: number;
  registered: boolean;
  wanted: boolean;
}

export function isWantedEligibleVariant(variantID: string): boolean {
  return !variantID.toLowerCase().includes('shadow');
}

function isTradeEligibleInstance(instance: Instances[string]): boolean {
  return Boolean(
    instance.is_caught &&
      !instance.shadow &&
      !instance.lucky &&
      !instance.mega &&
      !instance.is_mega &&
      !instance.is_fused &&
      ![2270, 2271].includes(Number(instance.pokemon_id)),
  );
}

export function buildPersonalRankingStatuses(
  instances: Instances,
): Map<string, PersonalRankingStatus> {
  const statuses = new Map<string, PersonalRankingStatus>();

  for (const [instanceID, instance] of Object.entries(instances)) {
    const variantID = String(instance.variant_id || '').trim();
    if (!variantID || instance.disabled) continue;

    const status = statuses.get(variantID) ?? {
      instanceIDs: [],
      caughtInstanceIDs: [],
      tradeInstanceIDs: [],
      caughtCount: 0,
      tradeCount: 0,
      availableCount: 0,
      registered: false,
      wanted: false,
    };

    status.instanceIDs.push(instanceID);
    status.registered ||= Boolean(instance.registered || instance.is_caught);
    status.wanted ||=
      isWantedEligibleVariant(variantID) && Boolean(instance.is_wanted);

    if (instance.is_caught) {
      status.caughtInstanceIDs.push(instanceID);
      status.caughtCount += 1;
      if (instance.is_for_trade && isTradeEligibleInstance(instance)) {
        status.tradeInstanceIDs.push(instanceID);
        status.tradeCount += 1;
      } else if (isTradeEligibleInstance(instance)) {
        status.availableCount += 1;
      }
    }

    statuses.set(variantID, status);
  }

  return statuses;
}

export function matchesPersonalRankingFilter(
  status: PersonalRankingStatus | undefined,
  filter: PersonalRankingFilter,
): boolean {
  switch (filter) {
    case 'owned':
      return Boolean(status?.registered);
    case 'available':
      return Boolean(status?.availableCount);
    case 'trade':
      return Boolean(status?.tradeCount);
    case 'wanted':
      return Boolean(status?.wanted);
    case 'missing':
      return !status?.registered;
    default:
      return true;
  }
}

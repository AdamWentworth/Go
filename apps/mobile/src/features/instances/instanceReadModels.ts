import type { InstancesMap } from '@pokemongonexus/shared-contracts/instances';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';

export type InstanceListItem = {
  instanceId: string;
  variantId: string;
  isCaught: boolean;
  isForTrade: boolean;
  isWanted: boolean;
  nickname: string | null;
};

const safeString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const toInstanceListItems = (instances: InstancesMap): InstanceListItem[] =>
  Object.entries(instances)
    .map(([instanceId, instance]) => ({
      instanceId,
      variantId: safeString(instance.variant_id),
      isCaught: instance.is_caught === true,
      isForTrade: instance.is_for_trade === true,
      isWanted: instance.is_wanted === true,
      nickname: typeof instance.nickname === 'string' ? instance.nickname : null,
    }))
    .sort((a, b) =>
      a.variantId === b.variantId
        ? a.instanceId.localeCompare(b.instanceId)
        : a.variantId.localeCompare(b.variantId),
    );

export const filterInstancesByOwnership = (
  items: InstanceListItem[],
  ownership: OwnershipMode,
): InstanceListItem[] => {
  switch (ownership) {
    case 'trade':
      return items.filter((item) => item.isForTrade);
    case 'wanted':
      return items.filter((item) => item.isWanted);
    case 'caught':
    default:
      return items.filter((item) => item.isCaught);
  }
};


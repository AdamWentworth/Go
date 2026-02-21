import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';

export type InstanceStatusMutation = 'caught' | 'trade' | 'wanted' | 'missing';

const withTimestamp = (instance: PokemonInstance, timestamp: number): PokemonInstance => ({
  ...instance,
  last_update: timestamp,
});

export const mutateInstanceStatus = (
  instance: PokemonInstance,
  targetStatus: InstanceStatusMutation,
  timestamp = Date.now(),
): PokemonInstance => {
  switch (targetStatus) {
    case 'caught':
      return withTimestamp(
        {
          ...instance,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          registered: true,
        },
        timestamp,
      );
    case 'trade':
      return withTimestamp(
        {
          ...instance,
          is_caught: true,
          is_for_trade: true,
          is_wanted: false,
          most_wanted: false,
          registered: true,
        },
        timestamp,
      );
    case 'wanted':
      return withTimestamp(
        {
          ...instance,
          is_caught: false,
          is_for_trade: false,
          is_wanted: true,
          registered: true,
        },
        timestamp,
      );
    case 'missing':
    default:
      return withTimestamp(
        {
          ...instance,
          is_caught: false,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          registered: false,
        },
        timestamp,
      );
  }
};

export const mutateInstanceFavorite = (
  instance: PokemonInstance,
  favorite: boolean,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      favorite,
    },
    timestamp,
  );

export const mutateInstanceMostWanted = (
  instance: PokemonInstance,
  mostWanted: boolean,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      most_wanted: instance.is_wanted ? mostWanted : false,
    },
    timestamp,
  );

export const mutateInstanceNickname = (
  instance: PokemonInstance,
  nickname: string | null,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      nickname,
    },
    timestamp,
  );

export const toReceiverPokemonPayload = (
  instance: PokemonInstance,
): Record<string, unknown> => {
  const key = String(instance.instance_id ?? '');
  return {
    operation: 'updatePokemon',
    key,
    instance_id: key,
    ...instance,
  };
};


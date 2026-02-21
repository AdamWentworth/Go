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

export const mutateInstanceMega = (
  instance: PokemonInstance,
  enabled: boolean,
  megaForm: string | null,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      mega: enabled,
      is_mega: enabled,
      mega_form: enabled ? megaForm : null,
    },
    timestamp,
  );

export const mutateInstanceFusion = (
  instance: PokemonInstance,
  enabled: boolean,
  fusionForm: string | null,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      is_fused: enabled,
      fusion_form: enabled ? fusionForm : null,
      fusion: enabled ? instance.fusion ?? {} : null,
    },
    timestamp,
  );

const normalizeTag = (tag: string): string => tag.trim();

const dedupeTags = (tags: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeTag(tag);
    if (!normalized) continue;
    const lowered = normalized.toLowerCase();
    if (seen.has(lowered)) continue;
    seen.add(lowered);
    output.push(normalized);
  }
  return output;
};

export const mutateInstanceAddTag = (
  instance: PokemonInstance,
  bucket: 'caught' | 'trade' | 'wanted',
  rawTag: string,
  timestamp = Date.now(),
): PokemonInstance => {
  const tag = normalizeTag(rawTag);
  if (!tag) return instance;

  if (bucket === 'caught') {
    const next = dedupeTags([...(instance.caught_tags ?? []), tag]);
    return withTimestamp({ ...instance, caught_tags: next }, timestamp);
  }

  if (bucket === 'trade') {
    const next = dedupeTags([...(instance.trade_tags ?? []), tag]);
    return withTimestamp({ ...instance, trade_tags: next }, timestamp);
  }

  const next = dedupeTags([...(instance.wanted_tags ?? []), tag]);
  return withTimestamp({ ...instance, wanted_tags: next }, timestamp);
};

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

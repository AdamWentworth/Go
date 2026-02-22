import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';

export type InstanceStatusMutation = 'caught' | 'trade' | 'wanted' | 'missing';
export type InstanceBattleStatsMutation = {
  cp: number | null;
  level: number | null;
  attackIv: number | null;
  defenseIv: number | null;
  staminaIv: number | null;
};
export type InstanceCaughtDetailsMutation = {
  gender: string | null;
  dateCaught: string | null;
};
export type InstanceMovesMutation = {
  fastMoveId: number | null;
  chargedMove1Id: number | null;
  chargedMove2Id: number | null;
};
export type InstanceAuraMutation = {
  lucky: boolean;
  shadow: boolean;
  purified: boolean;
};
export type InstanceLocationDetailsMutation = {
  locationCaught: string | null;
  locationCard: string | null;
};

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

export const mutateInstanceBattleStats = (
  instance: PokemonInstance,
  stats: InstanceBattleStatsMutation,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      cp: stats.cp,
      level: stats.level,
      attack_iv: stats.attackIv,
      defense_iv: stats.defenseIv,
      stamina_iv: stats.staminaIv,
    },
    timestamp,
  );

export const mutateInstanceCaughtDetails = (
  instance: PokemonInstance,
  details: InstanceCaughtDetailsMutation,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      gender: details.gender,
      date_caught: details.dateCaught,
    },
    timestamp,
  );

export const mutateInstanceMoves = (
  instance: PokemonInstance,
  moves: InstanceMovesMutation,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      fast_move_id: moves.fastMoveId,
      charged_move1_id: moves.chargedMove1Id,
      charged_move2_id: moves.chargedMove2Id,
    },
    timestamp,
  );

export const mutateInstanceAura = (
  instance: PokemonInstance,
  aura: InstanceAuraMutation,
  timestamp = Date.now(),
): PokemonInstance => {
  const normalizedPurified = aura.purified ? true : false;
  const normalizedShadow = normalizedPurified ? false : aura.shadow;
  const normalizedPurifiedAfterShadow = normalizedShadow ? false : normalizedPurified;
  const normalizedLucky = normalizedShadow ? false : aura.lucky;

  return withTimestamp(
    {
      ...instance,
      lucky: normalizedLucky,
      shadow: normalizedShadow,
      purified: normalizedPurifiedAfterShadow,
    },
    timestamp,
  );
};

export const mutateInstanceLocationDetails = (
  instance: PokemonInstance,
  details: InstanceLocationDetailsMutation,
  timestamp = Date.now(),
): PokemonInstance =>
  withTimestamp(
    {
      ...instance,
      location_caught: details.locationCaught,
      location_card: details.locationCard,
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

export const mutateInstanceRemoveTag = (
  instance: PokemonInstance,
  bucket: 'caught' | 'trade' | 'wanted',
  rawTag: string,
  timestamp = Date.now(),
): PokemonInstance => {
  const tag = normalizeTag(rawTag);
  if (!tag) return instance;

  const removeTag = (tags: string[] | null): string[] => {
    const normalized = dedupeTags(tags ?? []);
    return normalized.filter((existing) => existing.toLowerCase() !== tag.toLowerCase());
  };

  if (bucket === 'caught') {
    return withTimestamp({ ...instance, caught_tags: removeTag(instance.caught_tags) }, timestamp);
  }
  if (bucket === 'trade') {
    return withTimestamp({ ...instance, trade_tags: removeTag(instance.trade_tags) }, timestamp);
  }
  return withTimestamp({ ...instance, wanted_tags: removeTag(instance.wanted_tags) }, timestamp);
};

export const mutateInstanceSetTags = (
  instance: PokemonInstance,
  bucket: 'caught' | 'trade' | 'wanted',
  nextTags: string[],
  timestamp = Date.now(),
): PokemonInstance => {
  const normalized = dedupeTags(nextTags);
  if (bucket === 'caught') {
    return withTimestamp({ ...instance, caught_tags: normalized }, timestamp);
  }
  if (bucket === 'trade') {
    return withTimestamp({ ...instance, trade_tags: normalized }, timestamp);
  }
  return withTimestamp({ ...instance, wanted_tags: normalized }, timestamp);
};

export const mutateInstanceClearTags = (
  instance: PokemonInstance,
  bucket: 'caught' | 'trade' | 'wanted',
  timestamp = Date.now(),
): PokemonInstance => mutateInstanceSetTags(instance, bucket, [], timestamp);

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

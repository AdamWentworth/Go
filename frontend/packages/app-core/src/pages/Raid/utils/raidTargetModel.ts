import type { PokemonVariant } from "@/types/pokemonVariants";
import { cpMultipliers } from "./constants";
import {
  buildRaidIncomingPressureScenarios,
  calculateRaidBossStats,
  calculateRaidIncomingPressure,
  type RaidIncomingPressureScenario,
} from "./raidCombat";
import {
  getRaidTierKeyForVariant,
  getVariantTypeNames,
  isShadowRaidTier,
} from "./raidCatalog";
import {
  RAID_TIER_PRESETS,
  SHADOW_ATTACKER_DEFENSE_MULTIPLIER,
  TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR,
  TYPE_DPS_INCOMING_DAMAGE_NUMERATOR,
  TYPE_DPS_TARGET_DEFENSE,
} from "./raidRules";
import type {
  RaidCounterSettings,
  RaidOverallTargetProfile,
} from "./raidTypes";

export type RaidAttackerBattleStats = {
  attack: number;
  defense: number;
  hp: number;
};

export type RaidTargetCombatContext = {
  profile: RaidOverallTargetProfile;
  targetDefense: number;
  incomingDps: number;
  incomingChargedDamage: number;
  timeToFaintSeconds: number;
};

type PreparedRaidTargetContext = {
  profile: RaidOverallTargetProfile;
  targetDefense: number;
  incomingPressureScenarios: RaidIncomingPressureScenario[];
};

const preparedTargetContextCache = new WeakMap<
  RaidOverallTargetProfile[],
  Map<string, PreparedRaidTargetContext[]>
>();

export const calculateRaidAttackerBattleStats = (
  attacker: PokemonVariant,
  settings: RaidCounterSettings,
): RaidAttackerBattleStats => {
  const cpMultiplier = cpMultipliers[settings.attackerLevel];
  const shadowDefense = attacker.variantType.toLowerCase().includes("shadow")
    ? SHADOW_ATTACKER_DEFENSE_MULTIPLIER
    : 1;

  return {
    attack: (attacker.attack + 15) * cpMultiplier,
    defense: (attacker.defense + 15) * cpMultiplier * shadowDefense,
    hp: Math.max(1, Math.floor((attacker.stamina + 15) * cpMultiplier)),
  };
};

const prepareRaidTargetContexts = (
  profiles: RaidOverallTargetProfile[],
  attackerTypes: string[],
  weatherBoostedType: string,
): PreparedRaidTargetContext[] => {
  const cacheKey = `${[...attackerTypes].sort().join("/")}|${weatherBoostedType}`;
  const profileCache =
    preparedTargetContextCache.get(profiles) ??
    new Map<string, PreparedRaidTargetContext[]>();
  preparedTargetContextCache.set(profiles, profileCache);

  const cached = profileCache.get(cacheKey);
  if (cached) return cached;

  const prepared = profiles.map((profile) => {
    if (!profile.target) {
      return {
        profile,
        targetDefense: TYPE_DPS_TARGET_DEFENSE,
        incomingPressureScenarios: [],
      };
    }

    const target = profile.target;
    const tierKey = getRaidTierKeyForVariant(target);
    const tier = tierKey ? RAID_TIER_PRESETS[tierKey] : null;
    const bossStats = tier
      ? calculateRaidBossStats(
          target,
          tier,
          isShadowRaidTier(tier.key) ? "subdued" : "normal",
        )
      : null;

    return {
      profile,
      targetDefense: bossStats?.defense ?? TYPE_DPS_TARGET_DEFENSE,
      incomingPressureScenarios: bossStats
        ? buildRaidIncomingPressureScenarios({
            boss: target,
            bossAttack: bossStats.attack,
            attackerTypes,
            weatherBoostedType,
          })
        : [],
    };
  });

  profileCache.set(cacheKey, prepared);
  return prepared;
};

export const buildRaidTargetCombatContexts = (
  attacker: PokemonVariant,
  settings: RaidCounterSettings,
  profiles: RaidOverallTargetProfile[],
  attackerStats = calculateRaidAttackerBattleStats(attacker, settings),
): RaidTargetCombatContext[] =>
  prepareRaidTargetContexts(
    profiles,
    getVariantTypeNames(attacker),
    settings.weatherBoostedType,
  ).map((prepared) => {
    const pressure = calculateRaidIncomingPressure(
      prepared.incomingPressureScenarios,
      attackerStats.defense,
      settings.bossMovesetMode,
    );
    const incomingDps =
      pressure?.incomingDps ??
      TYPE_DPS_INCOMING_DAMAGE_NUMERATOR / attackerStats.defense;
    const incomingChargedDamage =
      pressure?.incomingChargedDamage ??
      TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR / attackerStats.defense;

    return {
      profile: prepared.profile,
      targetDefense: prepared.targetDefense,
      incomingDps,
      incomingChargedDamage,
      timeToFaintSeconds: attackerStats.hp / incomingDps,
    };
  });

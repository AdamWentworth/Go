import type { PokemonVariant } from "@/types/pokemonVariants";
import { cpMultipliers } from "./constants";
import {
  calculateRaidBossStats,
  calculateRaidIncomingPressureModel,
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
  incomingDpsCoefficient: number;
  incomingDpsFloorContribution: number;
  incomingChargedDamageCoefficient: number;
  incomingChargedDamageFloorContribution: number;
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
    const members =
      profile.targets && profile.targets.length > 0
        ? profile.targets
        : profile.target
          ? [{ target: profile.target, weight: profile.weight }]
          : [];

    if (members.length === 0) {
      return {
        profile,
        targetDefense: TYPE_DPS_TARGET_DEFENSE,
        incomingDpsCoefficient: TYPE_DPS_INCOMING_DAMAGE_NUMERATOR,
        incomingDpsFloorContribution: 0,
        incomingChargedDamageCoefficient:
          TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR,
        incomingChargedDamageFloorContribution: 0,
      };
    }

    let totalWeight = 0;
    let reciprocalDefenseSum = 0;
    let incomingDpsCoefficientSum = 0;
    let incomingDpsFloorContributionSum = 0;
    let incomingChargedDamageCoefficientSum = 0;
    let incomingChargedDamageFloorContributionSum = 0;

    members.forEach(({ target, weight }) => {
      const tierKey = getRaidTierKeyForVariant(target);
      const tier = tierKey ? RAID_TIER_PRESETS[tierKey] : null;
      const bossStats = tier
        ? calculateRaidBossStats(
            target,
            tier,
            isShadowRaidTier(tier.key) ? "subdued" : "normal",
          )
        : null;
      const pressureModel = bossStats
        ? calculateRaidIncomingPressureModel({
            boss: target,
            bossAttack: bossStats.attack,
            attackerTypes,
            weatherBoostedType,
          })
        : null;

      totalWeight += weight;
      reciprocalDefenseSum +=
        weight / (bossStats?.defense ?? TYPE_DPS_TARGET_DEFENSE);
      incomingDpsCoefficientSum +=
        (pressureModel?.incomingDpsCoefficient ??
          TYPE_DPS_INCOMING_DAMAGE_NUMERATOR) * weight;
      incomingDpsFloorContributionSum +=
        (pressureModel?.incomingDpsFloorContribution ?? 0) * weight;
      incomingChargedDamageCoefficientSum +=
        (pressureModel?.incomingChargedDamageCoefficient ??
          TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR) * weight;
      incomingChargedDamageFloorContributionSum +=
        (pressureModel?.incomingChargedDamageFloorContribution ?? 0) * weight;
    });

    const averageWeight = Math.max(1, totalWeight);
    return {
      profile,
      targetDefense:
        reciprocalDefenseSum > 0
          ? averageWeight / reciprocalDefenseSum
          : TYPE_DPS_TARGET_DEFENSE,
      incomingDpsCoefficient:
        incomingDpsCoefficientSum / averageWeight,
      incomingDpsFloorContribution:
        incomingDpsFloorContributionSum / averageWeight,
      incomingChargedDamageCoefficient:
        incomingChargedDamageCoefficientSum / averageWeight,
      incomingChargedDamageFloorContribution:
        incomingChargedDamageFloorContributionSum / averageWeight,
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
    const incomingDps =
      prepared.incomingDpsCoefficient / attackerStats.defense +
      prepared.incomingDpsFloorContribution;
    const incomingChargedDamage =
      prepared.incomingChargedDamageCoefficient / attackerStats.defense +
      prepared.incomingChargedDamageFloorContribution;

    return {
      profile: prepared.profile,
      targetDefense: prepared.targetDefense,
      incomingDps,
      incomingChargedDamage,
      timeToFaintSeconds: attackerStats.hp / incomingDps,
    };
  });

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import { cpMultipliers } from "./constants";
import { getTypeEffectivenessMultiplier } from "./typeEffectiveness";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidGroupEstimate,
  RaidOverallScore,
  RaidOverallTargetProfile,
  RaidTierKey,
  RaidTierPreset,
  RaidTypeDpsScore,
  ShadowBossMode,
} from "./raidTypes";
import {
  COMFORTABLE_SAFETY_FACTOR,
  FALLBACK_OVERALL_TARGET_PROFILES,
  RAID_SAFETY_FACTOR,
  TYPE_DPS_ER_TDO_EXPONENT,
} from "./raidRules";
import {
  getLegalRaidChargedMoves,
  getLegalRaidFastMoves,
  getRaidOverallTargetProfiles,
  getRaidTypeTargetProfiles,
  getRaidTierKeyForVariant,
  getVariantTypeNames,
  isEligibleRaidAttacker,
  normalizeTypeName,
} from "./raidCatalog";
import {
  calculateComprehensiveTypeDps,
  calculateEffectiveRaidDps,
  calculatePokemonCpForLevel,
  calculateRaidBossStats,
  calculateRaidMoveDamage,
  calculateTypeDpsMoveDamage,
  compareRaidOverallScores,
  compareRaidTypeDpsScores,
  getProcessedRaidMoveSeconds,
  getRaidMoveCooldown,
  getRaidMoveEnergy,
  getTypeDpsEffectiveness,
} from "./raidCombat";
import {
  buildRaidTargetCombatContexts,
  calculateRaidAttackerBattleStats,
  type RaidTargetCombatContext,
} from "./raidTargetModel";

export type {
  FriendshipKey,
  MegaAllyBonusKey,
  PartyPowerKey,
  RaidBossStats,
  RaidCounterScore,
  RaidCounterSettings,
  RaidGroupEstimate,
  RaidOverallScore,
  RaidTierKey,
  RaidTierPreset,
  RaidTypeDpsScore,
  ShadowBossMode,
} from "./raidTypes";

export {
  DEFAULT_RAID_RELOBBY_SECONDS,
  FRIENDSHIP_DAMAGE_BONUS,
  MEGA_ALLY_DAMAGE_BONUS,
  RAID_ATTACKER_TEAM_SIZE,
  RAID_TIER_PRESETS,
} from "./raidRules";

export {
  getPrimaryRaidMetadataForVariant,
  getRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  getVariantTypeNames,
  isEligibleRaidAttacker,
  isEligibleRaidBoss,
  isMaxBattleVariant,
  isRaidCosmeticVariant,
  isShadowRaidTier,
} from "./raidCatalog";

export {
  calculateEffectiveRaidDps,
  calculatePokemonCpForLevel,
  calculateRaidBossCp,
  calculateRaidBossStats,
  calculateRaidMoveDamage,
} from "./raidCombat";

export const calculateMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  boss: PokemonVariant,
  tier: RaidTierPreset,
  settings: RaidCounterSettings,
): RaidCounterScore => {
  const cpMultiplier = cpMultipliers[settings.attackerLevel];
  const attackerAttack = (attacker.attack + 15) * cpMultiplier;
  const bossTypes = getVariantTypeNames(boss);
  const bossStats = calculateRaidBossStats(boss, tier, settings.shadowBossMode);

  const fastDamage = calculateRaidMoveDamage({
    move: fastMove,
    attacker,
    attackerAttack,
    bossDefense: bossStats.defense,
    bossTypes,
    settings,
    charged: false,
  });
  const chargedDamage = calculateRaidMoveDamage({
    move: chargedMove,
    attacker,
    attackerAttack,
    bossDefense: bossStats.defense,
    bossTypes,
    settings,
    charged: true,
  });
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = Math.max(0.5, getRaidMoveCooldown(fastMove) / 1000);
  const chargedSeconds = Math.max(0.5, getRaidMoveCooldown(chargedMove) / 1000);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;
  const cycleDamage = fastUses * fastDamage + chargedDamage;
  const dps = cycleDamage / cycleSeconds;
  const soloTimeSeconds = bossStats.hp / dps;

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    dps,
    fastDamage,
    chargedDamage,
    cycleSeconds,
    cycleDamage,
    effectiveness: getTypeEffectivenessMultiplier(
      normalizeTypeName(chargedMove.type_name || chargedMove.type),
      bossTypes,
    ),
    soloTimeSeconds,
    trainersNeeded: Math.max(
      1,
      Math.ceil(
        bossStats.hp / (dps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR),
      ),
    ),
  };
};

export const scoreRaidCounters = (
  attackers: PokemonVariant[],
  boss: PokemonVariant,
  tier: RaidTierPreset,
  settings: RaidCounterSettings,
): RaidCounterScore[] =>
  attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);

      return fastMoves.flatMap((fastMove) =>
        chargedMoves.map((chargedMove) =>
          calculateMoveCycleScore(
            attacker,
            fastMove,
            chargedMove,
            boss,
            tier,
            settings,
          ),
        ),
      );
    })
    .sort((a, b) => b.dps - a.dps);

export const calculateOverallMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  settings: RaidCounterSettings,
  targetProfiles: RaidOverallTargetProfile[] = FALLBACK_OVERALL_TARGET_PROFILES,
  preparedTargetContexts?: RaidTargetCombatContext[],
): RaidOverallScore => {
  const attackerStats = calculateRaidAttackerBattleStats(attacker, settings);
  const targetContexts =
    preparedTargetContexts ??
    buildRaidTargetCombatContexts(
      attacker,
      settings,
      targetProfiles,
      attackerStats,
    );
  const attackerAttack = attackerStats.attack;
  const attackerHp = attackerStats.hp;
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
  const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;

  let scoreWeight = 0;
  let fastDamageSum = 0;
  let chargedDamageSum = 0;
  let cycleDamageSum = 0;
  let dpsSum = 0;
  let tdoSum = 0;
  let erSum = 0;
  let eDpsSum = 0;

  for (const targetContext of targetContexts) {
    const targetProfile = targetContext.profile;
    const targetTypes = targetProfile.types;
    const weight = targetProfile.weight;
    const fastDamage = calculateTypeDpsMoveDamage({
      move: fastMove,
      attacker,
      attackerAttack,
      selectedType: "",
      targetTypes,
      targetDefense: targetContext.targetDefense,
      settings,
      charged: false,
    });
    const chargedDamage = calculateTypeDpsMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack,
      selectedType: "",
      targetTypes,
      targetDefense: targetContext.targetDefense,
      settings,
      charged: true,
    });
    const dps = calculateComprehensiveTypeDps({
      fastDamage,
      chargedDamage,
      fastMove,
      chargedMove,
      attackerHp,
      incomingDps: targetContext.incomingDps,
      incomingChargedDamage: targetContext.incomingChargedDamage,
    });
    const tdo = dps * targetContext.timeToFaintSeconds;
    const er =
      dps > 0 && tdo > 0
        ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
          Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
        : 0;
    const eDps = calculateEffectiveRaidDps({
      dps,
      tdo,
      relobbySeconds: settings.relobbySeconds,
    });

    scoreWeight += weight;
    fastDamageSum += fastDamage * weight;
    chargedDamageSum += chargedDamage * weight;
    cycleDamageSum += (fastUses * fastDamage + chargedDamage) * weight;
    dpsSum += dps * weight;
    tdoSum += tdo * weight;
    erSum += er * weight;
    eDpsSum += eDps * weight;
  }

  const averageWeight = Math.max(1, scoreWeight);
  const fastDamage = fastDamageSum / averageWeight;
  const chargedDamage = chargedDamageSum / averageWeight;
  const cycleDamage = cycleDamageSum / averageWeight;
  const dps = dpsSum / averageWeight;
  const tdo = tdoSum / averageWeight;
  const er = erSum / averageWeight;
  const eDps = eDpsSum / averageWeight;

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    eDps,
    dps,
    tdo,
    er,
    fastDamage,
    chargedDamage,
    cycleSeconds,
    cycleDamage,
  };
};

export const scoreRaidOverallAttackers = (
  attackers: PokemonVariant[],
  settings: RaidCounterSettings,
  targets?: PokemonVariant[],
): RaidOverallScore[] => {
  const targetProfiles = getRaidOverallTargetProfiles(targets);

  return attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);
      const targetContexts = buildRaidTargetCombatContexts(
        attacker,
        settings,
        targetProfiles,
      );

      return fastMoves.flatMap((fastMove) =>
        chargedMoves.map((chargedMove) =>
          calculateOverallMoveCycleScore(
            attacker,
            fastMove,
            chargedMove,
            settings,
            targetProfiles,
            targetContexts,
          ),
        ),
      );
    })
    .sort(compareRaidOverallScores);
};

export const scoreBestRaidOverallAttackers = (
  attackers: PokemonVariant[],
  settings: RaidCounterSettings,
  targets?: PokemonVariant[],
): RaidOverallScore[] => {
  const targetProfiles = getRaidOverallTargetProfiles(targets);
  const targetWeight = Math.max(
    1,
    targetProfiles.reduce((sum, profile) => sum + profile.weight, 0),
  );
  const bestByVariant = new Map<string, RaidOverallScore>();

  attackers.filter(isEligibleRaidAttacker).forEach((attacker) => {
    const fastMoves = getLegalRaidFastMoves(attacker);
    const chargedMoves = getLegalRaidChargedMoves(attacker);
    const key =
      attacker.variant_id || `${attacker.pokemon_id}-${attacker.variantType}`;
    const attackerStats = calculateRaidAttackerBattleStats(attacker, settings);
    const attackerAttack = attackerStats.attack;
    const attackerHp = attackerStats.hp;
    const targetContexts = buildRaidTargetCombatContexts(
      attacker,
      settings,
      targetProfiles,
      attackerStats,
    );
    const cp = calculatePokemonCpForLevel(attacker, settings.attackerLevel);
    const prepareMoveDamages = (moves: Move[], charged: boolean) =>
      moves.map((move) => ({
        move,
        damages: targetContexts.map((targetContext) =>
          calculateTypeDpsMoveDamage({
            move,
            attacker,
            attackerAttack,
            selectedType: "",
            targetTypes: targetContext.profile.types,
            targetDefense: targetContext.targetDefense,
            settings,
            charged,
          }),
        ),
      }));
    const fastMoveDamages = prepareMoveDamages(fastMoves, false);
    const chargedMoveDamages = prepareMoveDamages(chargedMoves, true);

    fastMoveDamages.forEach(({ move: fastMove, damages: fastDamages }) => {
      chargedMoveDamages.forEach(
        ({ move: chargedMove, damages: chargedDamages }) => {
          const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
          const chargedEnergyCost = Math.max(
            1,
            Math.abs(getRaidMoveEnergy(chargedMove)),
          );
          const fastUses = Math.max(
            1,
            Math.ceil(chargedEnergyCost / fastEnergy),
          );
          const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
          const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
          const cycleSeconds = fastUses * fastSeconds + chargedSeconds;

          let fastDamageSum = 0;
          let chargedDamageSum = 0;
          let cycleDamageSum = 0;
          let dpsSum = 0;
          let tdoSum = 0;
          let erSum = 0;
          let eDpsSum = 0;

          targetContexts.forEach((targetContext, index) => {
            const targetProfile = targetContext.profile;
            const weight = targetProfile.weight;
            const fastDamage = fastDamages[index] ?? 0;
            const chargedDamage = chargedDamages[index] ?? 0;
            const dps = calculateComprehensiveTypeDps({
              fastDamage,
              chargedDamage,
              fastMove,
              chargedMove,
              attackerHp,
              incomingDps: targetContext.incomingDps,
              incomingChargedDamage: targetContext.incomingChargedDamage,
            });
            const tdo = dps * targetContext.timeToFaintSeconds;
            const er =
              dps > 0 && tdo > 0
                ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
                  Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
                : 0;
            const eDps = calculateEffectiveRaidDps({
              dps,
              tdo,
              relobbySeconds: settings.relobbySeconds,
            });

            fastDamageSum += fastDamage * weight;
            chargedDamageSum += chargedDamage * weight;
            cycleDamageSum += (fastUses * fastDamage + chargedDamage) * weight;
            dpsSum += dps * weight;
            tdoSum += tdo * weight;
            erSum += er * weight;
            eDpsSum += eDps * weight;
          });

          const score: RaidOverallScore = {
            variant: attacker,
            fastMove,
            chargedMove,
            cp,
            eDps: eDpsSum / targetWeight,
            dps: dpsSum / targetWeight,
            tdo: tdoSum / targetWeight,
            er: erSum / targetWeight,
            fastDamage: fastDamageSum / targetWeight,
            chargedDamage: chargedDamageSum / targetWeight,
            cycleSeconds,
            cycleDamage: cycleDamageSum / targetWeight,
          };
          const current = bestByVariant.get(key);
          if (!current || compareRaidOverallScores(score, current) < 0) {
            bestByVariant.set(key, score);
          }
        },
      );
    });
  });

  return Array.from(bestByVariant.values()).sort(compareRaidOverallScores);
};

export const calculateTypeMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  typeName: string,
  settings: RaidCounterSettings,
  targetProfiles: RaidOverallTargetProfile[] = [],
  preparedTargetContexts?: RaidTargetCombatContext[],
): RaidTypeDpsScore => {
  const targetType = normalizeTypeName(typeName);
  const fastType = normalizeTypeName(fastMove.type_name || fastMove.type);
  const chargedType = normalizeTypeName(
    chargedMove.type_name || chargedMove.type,
  );
  const attackerStats = calculateRaidAttackerBattleStats(attacker, settings);
  const attackerAttack = attackerStats.attack;
  const attackerHp = attackerStats.hp;
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
  const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;
  const effectiveProfiles =
    targetProfiles.length > 0
      ? targetProfiles
      : [{ types: [], weight: 1 } satisfies RaidOverallTargetProfile];
  const targetContexts =
    preparedTargetContexts ??
    buildRaidTargetCombatContexts(
      attacker,
      settings,
      effectiveProfiles,
      attackerStats,
    );

  let totalWeight = 0;
  let fastDamageSum = 0;
  let chargedDamageSum = 0;
  let fastEffectivenessSum = 0;
  let chargedEffectivenessSum = 0;
  let targetEffectivenessSum = 0;
  let cycleDamageSum = 0;
  let dpsSum = 0;
  let tdoSum = 0;
  let eDpsSum = 0;
  let erSum = 0;

  targetContexts.forEach((targetContext) => {
    const targetProfile = targetContext.profile;
    const useRealTarget = targetProfile.types.length > 0;
    const fastEffectiveness = useRealTarget
      ? getTypeEffectivenessMultiplier(fastType, targetProfile.types)
      : getTypeDpsEffectiveness(fastType, targetType);
    const chargedEffectiveness = useRealTarget
      ? getTypeEffectivenessMultiplier(chargedType, targetProfile.types)
      : getTypeDpsEffectiveness(chargedType, targetType);
    const targetEffectiveness = useRealTarget
      ? getTypeEffectivenessMultiplier(targetType, targetProfile.types)
      : targetType === "normal"
        ? 1
        : 1.6;
    const fastDamage = calculateTypeDpsMoveDamage({
      move: fastMove,
      attacker,
      attackerAttack,
      selectedType: targetType,
      targetTypes: useRealTarget ? targetProfile.types : undefined,
      targetDefense: targetContext.targetDefense,
      settings,
      charged: false,
    });
    const chargedDamage = calculateTypeDpsMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack,
      selectedType: targetType,
      targetTypes: useRealTarget ? targetProfile.types : undefined,
      targetDefense: targetContext.targetDefense,
      settings,
      charged: true,
    });
    const dps = calculateComprehensiveTypeDps({
      fastDamage,
      chargedDamage,
      fastMove,
      chargedMove,
      attackerHp,
      incomingDps: targetContext.incomingDps,
      incomingChargedDamage: targetContext.incomingChargedDamage,
    });
    const tdo = dps * targetContext.timeToFaintSeconds;
    const eDps = calculateEffectiveRaidDps({
      dps,
      tdo,
      relobbySeconds: settings.relobbySeconds,
    });
    const er =
      dps > 0 && tdo > 0
        ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
          Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
        : 0;
    const weight = targetProfile.weight;

    totalWeight += weight;
    fastDamageSum += fastDamage * weight;
    chargedDamageSum += chargedDamage * weight;
    fastEffectivenessSum += fastEffectiveness * weight;
    chargedEffectivenessSum += chargedEffectiveness * weight;
    targetEffectivenessSum += targetEffectiveness * weight;
    cycleDamageSum += (fastUses * fastDamage + chargedDamage) * weight;
    dpsSum += dps * weight;
    tdoSum += tdo * weight;
    eDpsSum += eDps * weight;
    erSum += er * weight;
  });

  const averageWeight = Math.max(1, totalWeight);
  const fastDamage = fastDamageSum / averageWeight;
  const chargedDamage = chargedDamageSum / averageWeight;
  const dps = dpsSum / averageWeight;
  const tdo = tdoSum / averageWeight;

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    totalDps: dps,
    eDps: eDpsSum / averageWeight,
    dps,
    tdo,
    er: erSum / averageWeight,
    fastDamage,
    chargedDamage,
    fastEffectiveness: fastEffectivenessSum / averageWeight,
    chargedEffectiveness: chargedEffectivenessSum / averageWeight,
    cycleSeconds,
    cycleDamage: cycleDamageSum / averageWeight,
    targetEffectiveness: targetEffectivenessSum / averageWeight,
    fastMatchesType: fastType === targetType,
    chargedMatchesType: chargedType === targetType,
  };
};

export const scoreRaidTypeDps = (
  attackers: PokemonVariant[],
  typeName: string,
  settings: RaidCounterSettings,
  targets?: PokemonVariant[],
): RaidTypeDpsScore[] => {
  const targetType = normalizeTypeName(typeName);
  if (!targetType) return [];
  const targetProfiles = getRaidTypeTargetProfiles(targetType, targets);

  return attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);
      const effectiveProfiles =
        targetProfiles.length > 0
          ? targetProfiles
          : [{ types: [], weight: 1 } satisfies RaidOverallTargetProfile];
      const targetContexts = buildRaidTargetCombatContexts(
        attacker,
        settings,
        effectiveProfiles,
      );

      return fastMoves.flatMap((fastMove) =>
        chargedMoves
          .filter((chargedMove) => {
            const fastType = normalizeTypeName(
              fastMove.type_name || fastMove.type,
            );
            const chargedType = normalizeTypeName(
              chargedMove.type_name || chargedMove.type,
            );
            return fastType === targetType || chargedType === targetType;
          })
          .map((chargedMove) =>
            calculateTypeMoveCycleScore(
              attacker,
              fastMove,
              chargedMove,
              targetType,
              settings,
              targetProfiles,
              targetContexts,
            ),
          ),
      );
    })
    .sort(compareRaidTypeDpsScores);
};

export const dedupeBestCounterPerVariant = (
  scores: RaidCounterScore[],
): RaidCounterScore[] => {
  const bestByVariant = new Map<string, RaidCounterScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || score.dps > current.dps) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort((a, b) => b.dps - a.dps);
};

export const dedupeBestTypeDpsPerVariant = (
  scores: RaidTypeDpsScore[],
): RaidTypeDpsScore[] => {
  const bestByVariant = new Map<string, RaidTypeDpsScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || compareRaidTypeDpsScores(score, current) < 0) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort(compareRaidTypeDpsScores);
};

export const dedupeBestOverallAttackerPerVariant = (
  scores: RaidOverallScore[],
): RaidOverallScore[] => {
  const bestByVariant = new Map<string, RaidOverallScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || compareRaidOverallScores(score, current) < 0) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort(compareRaidOverallScores);
};

export const estimateRaidGroup = (
  scores: RaidCounterScore[],
  boss: PokemonVariant,
  tier: RaidTierPreset,
  shadowBossMode: ShadowBossMode,
): RaidGroupEstimate => {
  const bestCounters = dedupeBestCounterPerVariant(scores).slice(0, 6);
  const topTeamDps =
    bestCounters.length > 0
      ? bestCounters.reduce((sum, counter) => sum + counter.dps, 0) /
        bestCounters.length
      : 0;
  const bossStats = calculateRaidBossStats(boss, tier, shadowBossMode);

  if (topTeamDps <= 0) {
    return {
      topTeamDps: 0,
      minTrainers: 0,
      comfortableTrainers: 0,
      soloTimeSeconds: 0,
    };
  }

  return {
    topTeamDps,
    minTrainers: Math.max(
      1,
      Math.ceil(
        bossStats.hp /
          (topTeamDps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR),
      ),
    ),
    comfortableTrainers: Math.max(
      1,
      Math.ceil(
        bossStats.hp /
          (topTeamDps * bossStats.timeLimitSeconds * COMFORTABLE_SAFETY_FACTOR),
      ),
    ),
    soloTimeSeconds: bossStats.hp / topTeamDps,
  };
};

export const inferRaidTierFromMetadata = (
  variant: PokemonVariant,
): RaidTierKey | null => {
  return getRaidTierKeyForVariant(variant);
};

export const formatSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};

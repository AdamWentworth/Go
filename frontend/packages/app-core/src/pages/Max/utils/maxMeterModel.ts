import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  calculateMaxBattleMoveDamage,
  MAX_MODEL_CONSTANTS,
  type MaxRankingEntry,
} from './maxBattleModel';

export type MaxMeterTier =
  | 'one-star'
  | 'two-star'
  | 'three-star'
  | 'legendary'
  | 'gigantamax';

export type MaxMeterStrategy = 'fast-only' | 'fast-and-charged';

export type MaxMeterPlan = {
  strategy: MaxMeterStrategy;
  fastMove: Move;
  chargedMove: Move | null;
  meterSeconds: number;
  meterEnergy: number;
  regularDamage: number;
  cycleDamage: number;
  cycleDps: number;
  fastUses: number;
  chargedUses: number;
};

type MaxMeterRule = {
  damageThresholdFraction: number;
  fractionalEnergy: boolean;
};

const STANDARD_MAX_METER_RULE: MaxMeterRule = {
  damageThresholdFraction: 0.005,
  fractionalEnergy: false,
};

// One-to-four-star battles retain whole-energy breakpoints. Legendary and
// Gigantamax battles use the fractional rules measured after the 2026 update.
const MAX_METER_RULES: Record<MaxMeterTier, MaxMeterRule> = {
  'one-star': STANDARD_MAX_METER_RULE,
  'two-star': STANDARD_MAX_METER_RULE,
  'three-star': STANDARD_MAX_METER_RULE,
  legendary: {
    damageThresholdFraction: 0.0025,
    fractionalEnergy: true,
  },
  gigantamax: {
    damageThresholdFraction: 0.00033,
    fractionalEnergy: true,
  },
};

const getMoveCooldownSeconds = (move: Move): number => {
  const raw = Number(move.raid_cooldown);
  return Math.max(0.5, raw > 20 ? raw / 1000 : raw);
};

const getLegalChargedMoves = (variant: PokemonVariant): Move[] =>
  (variant.moves ?? []).filter(
    (move) =>
      Number(move.is_fast) === 0 &&
      Number(move.raid_power) > 0 &&
      Number(move.raid_cooldown) > 0 &&
      Math.abs(Number(move.raid_energy)) > 0,
  );

export const getMaxMeterEnergyForHit = ({
  damage,
  bossHp,
  tier,
}: {
  damage: number;
  bossHp: number;
  tier: MaxMeterTier;
}): number => {
  const rule = MAX_METER_RULES[tier];
  const rawEnergy =
    Math.max(1, damage) /
    Math.max(1, bossHp * rule.damageThresholdFraction);
  const resolvedEnergy = rule.fractionalEnergy
    ? rawEnergy
    : Math.floor(rawEnergy);

  return Math.max(1, resolvedEnergy);
};

const simulateRotation = ({
  boss,
  bossHp,
  chargedMove,
  entry,
  maxPhaseDamage,
  maxPhaseSeconds,
  meterOrbEnergy,
  subgroupSize,
  tier,
}: {
  boss: PokemonVariant;
  bossHp: number;
  chargedMove: Move | null;
  entry: MaxRankingEntry;
  maxPhaseDamage: number;
  maxPhaseSeconds: number;
  meterOrbEnergy: number;
  subgroupSize: number;
  tier: MaxMeterTier;
}): MaxMeterPlan => {
  const fastMove = entry.fastMove;
  const targetEnergy = Math.max(
    1,
    MAX_MODEL_CONSTANTS.maxMeterEnergy - meterOrbEnergy,
  );
  const chargedCost = chargedMove
    ? Math.abs(Number(chargedMove.raid_energy))
    : Number.POSITIVE_INFINITY;
  const fastCombatEnergy = Math.max(0, Number(fastMove.raid_energy));
  let storedCombatEnergy = 0;
  let meterEnergy = 0;
  let meterSeconds = 0;
  let regularDamage = 0;
  let fastUses = 0;
  let chargedUses = 0;

  for (let action = 0; meterEnergy < targetEnergy && action < 10_000; action += 1) {
    const canUseChargedMove =
      chargedMove !== null && storedCombatEnergy >= chargedCost;
    const move = canUseChargedMove ? chargedMove : fastMove;
    const hitDamage = calculateMaxBattleMoveDamage(entry, boss, move);

    meterSeconds += getMoveCooldownSeconds(move);
    regularDamage += hitDamage * subgroupSize;
    meterEnergy +=
      getMaxMeterEnergyForHit({ damage: hitDamage, bossHp, tier }) *
      subgroupSize;

    if (canUseChargedMove) {
      storedCombatEnergy = Math.max(0, storedCombatEnergy - chargedCost);
      chargedUses += 1;
    } else {
      storedCombatEnergy = Math.min(
        100,
        storedCombatEnergy + fastCombatEnergy,
      );
      fastUses += 1;
    }
  }

  const cycleDamage = regularDamage + maxPhaseDamage;
  const cycleSeconds = meterSeconds + maxPhaseSeconds;

  return {
    strategy: chargedMove ? 'fast-and-charged' : 'fast-only',
    fastMove,
    chargedMove,
    meterSeconds,
    meterEnergy,
    regularDamage,
    cycleDamage,
    cycleDps: cycleDamage / Math.max(0.5, cycleSeconds),
    fastUses,
    chargedUses,
  };
};

export const selectMaxMeterPlan = ({
  boss,
  bossHp,
  entry,
  maxPhaseDamage,
  maxPhaseSeconds,
  meterOrbEnergy,
  subgroupSize,
  tier,
}: {
  boss: PokemonVariant;
  bossHp: number;
  entry: MaxRankingEntry;
  maxPhaseDamage: number;
  maxPhaseSeconds: number;
  meterOrbEnergy: number;
  subgroupSize: number;
  tier: MaxMeterTier;
}): MaxMeterPlan => {
  const chargedMoves = getLegalChargedMoves(entry.variant);
  const plans = [null, ...chargedMoves].map((chargedMove) =>
    simulateRotation({
      boss,
      bossHp,
      chargedMove,
      entry,
      maxPhaseDamage,
      maxPhaseSeconds,
      meterOrbEnergy,
      subgroupSize,
      tier,
    }),
  );

  return plans.sort(
    (left, right) =>
      right.cycleDps - left.cycleDps ||
      left.meterSeconds - right.meterSeconds ||
      right.regularDamage - left.regularDamage ||
      (left.chargedMove?.name ?? '').localeCompare(
        right.chargedMove?.name ?? '',
      ),
  )[0];
};

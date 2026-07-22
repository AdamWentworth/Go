import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  MAX_MODEL_CONSTANTS,
  type MaxRankingEntry,
} from './maxBattleModel';

export type MaxBattleSimulationTeam = {
  damage: MaxRankingEntry;
  tank: MaxRankingEntry;
  healing: MaxRankingEntry;
};

export type MaxBattleBossPreset = {
  kind: 'standard' | 'legendary' | 'gigantamax';
  label: string;
  bossHp: number;
  defaultTrainers: number;
  maxTrainers: number;
};

export type MaxBattleSimulationOutcome =
  | 'likely-clear'
  | 'close-call'
  | 'unlikely';

export type MaxBattleSimulationResult = {
  outcome: MaxBattleSimulationOutcome;
  bossHp: number;
  trainerCount: number;
  subgroupCount: number;
  lobbyDps: number;
  estimatedClearSeconds: number;
  survivalSeconds: number;
  limitingSeconds: number;
  damageBeforeLimit: number;
  damagePercent: number;
  estimatedMaxPhases: number;
  supportActionsPerGroup: number;
  limitedBySurvival: boolean;
};

export const MAX_BATTLE_SIMULATION_CONSTANTS = {
  enrageSeconds: 360,
  maxPhaseSeconds: 10,
  maxActionsPerTrainer: 3,
  standardBossHp: 10_000,
  legendaryBossHp: 50_000,
  gigantamaxBossHp: 90_000,
  standardMaxTrainers: 4,
  gigantamaxMaxTrainers: 40,
} as const;

const isGigantamaxBoss = (boss: PokemonVariant): boolean =>
  boss.variantType.toLowerCase().includes('gigantamax');

const isSpecialLegendaryBoss = (boss: PokemonVariant): boolean =>
  [888, 889, 890].includes(boss.pokemon_id);

export const getMaxBattleBossPreset = (
  boss: PokemonVariant,
): MaxBattleBossPreset => {
  if (isGigantamaxBoss(boss)) {
    return {
      kind: 'gigantamax',
      label: 'Six-star Gigantamax',
      bossHp: MAX_BATTLE_SIMULATION_CONSTANTS.gigantamaxBossHp,
      defaultTrainers: 12,
      maxTrainers: MAX_BATTLE_SIMULATION_CONSTANTS.gigantamaxMaxTrainers,
    };
  }

  if (isSpecialLegendaryBoss(boss)) {
    return {
      kind: 'legendary',
      label: 'Legendary Max',
      bossHp: MAX_BATTLE_SIMULATION_CONSTANTS.legendaryBossHp,
      defaultTrainers: 4,
      maxTrainers: MAX_BATTLE_SIMULATION_CONSTANTS.standardMaxTrainers,
    };
  }

  return {
    kind: 'standard',
    label: 'Standard Max',
    bossHp: MAX_BATTLE_SIMULATION_CONSTANTS.standardBossHp,
    defaultTrainers: 4,
    maxTrainers: MAX_BATTLE_SIMULATION_CONSTANTS.standardMaxTrainers,
  };
};

const getSubgroupSizes = (trainerCount: number): number[] => {
  const sizes: number[] = [];
  let remaining = trainerCount;

  while (remaining > 0) {
    const size = Math.min(MAX_MODEL_CONSTANTS.maxGroupSize, remaining);
    sizes.push(size);
    remaining -= size;
  }

  return sizes;
};

type SubgroupEstimate = {
  dps: number;
  cycleSeconds: number;
  survivalSeconds: number;
  supportActions: number;
};

const estimateSubgroup = (
  size: number,
  team: MaxBattleSimulationTeam,
): SubgroupEstimate => {
  const meterActionsPerTrainer = Math.ceil(
    MAX_MODEL_CONSTANTS.maxMeterEnergy / size,
  );
  const meterSeconds =
    meterActionsPerTrainer * Math.max(0.5, team.tank.meterSeconds);
  const cycleSeconds =
    meterSeconds + MAX_BATTLE_SIMULATION_CONSTANTS.maxPhaseSeconds;
  const maxActions =
    size * MAX_BATTLE_SIMULATION_CONSTANTS.maxActionsPerTrainer;
  const supportActions = Math.min(
    Math.max(0, maxActions - 1),
    Number(team.tank.maxGuardLevel > 0) +
      Number(team.healing.maxSpiritLevel > 0),
  );
  const attackActions = Math.max(1, maxActions - supportActions);
  const maxHitDamage = Math.max(
    1,
    team.damage.bossBenchmark?.maxHitDamage ?? 1,
  );
  const regularDamage =
    Math.max(1, team.tank.fastHitDamage) * meterActionsPerTrainer * size;
  const cycleDamage = regularDamage + maxHitDamage * attackActions;
  const incomingDps = Math.max(
    0,
    team.tank.bossBenchmark?.incomingDps ?? 0,
  );
  const incomingDamage = incomingDps * meterSeconds;
  const guardAbsorption =
    team.tank.maxGuardLevel > 0 ? team.tank.maxGuardHp : 0;
  const healing =
    team.healing.maxSpiritLevel > 0 ? team.healing.healPerAlly * size : 0;
  const netCycleDamage = Math.max(1, incomingDamage - guardAbsorption - healing);
  const partyHp =
    size * (team.damage.hp + team.tank.hp + team.healing.hp);
  const survivalCycles = partyHp / netCycleDamage;

  return {
    dps: cycleDamage / cycleSeconds,
    cycleSeconds,
    survivalSeconds: survivalCycles * cycleSeconds,
    supportActions,
  };
};

export const simulateMaxBattle = ({
  boss,
  bossHp,
  trainerCount,
  team,
}: {
  boss: PokemonVariant;
  bossHp?: number;
  trainerCount: number;
  team: MaxBattleSimulationTeam;
}): MaxBattleSimulationResult => {
  const preset = getMaxBattleBossPreset(boss);
  const normalizedTrainerCount = Math.min(
    preset.maxTrainers,
    Math.max(1, Math.round(trainerCount)),
  );
  const normalizedBossHp = Math.max(
    1,
    Math.round(Number.isFinite(Number(bossHp)) ? Number(bossHp) : preset.bossHp),
  );
  const subgroups = getSubgroupSizes(normalizedTrainerCount).map((size) =>
    estimateSubgroup(size, team),
  );
  const lobbyDps = subgroups.reduce((total, group) => total + group.dps, 0);
  const estimatedClearSeconds = normalizedBossHp / Math.max(0.01, lobbyDps);
  const survivalSeconds = Math.max(
    0,
    ...subgroups.map((group) => group.survivalSeconds),
  );
  const limitingSeconds = Math.min(
    MAX_BATTLE_SIMULATION_CONSTANTS.enrageSeconds,
    survivalSeconds,
  );
  const damageBeforeLimit = Math.min(
    normalizedBossHp,
    lobbyDps * limitingSeconds,
  );
  const damagePercent = damageBeforeLimit / normalizedBossHp;
  const averageCycleSeconds =
    subgroups.reduce((total, group) => total + group.cycleSeconds, 0) /
    subgroups.length;
  const estimatedMaxPhases = Math.max(
    1,
    Math.ceil(
      Math.min(estimatedClearSeconds, limitingSeconds) /
        Math.max(1, averageCycleSeconds),
    ),
  );
  const clears = estimatedClearSeconds <= limitingSeconds;
  const outcome: MaxBattleSimulationOutcome = clears
    ? estimatedClearSeconds <= limitingSeconds * 0.85
      ? 'likely-clear'
      : 'close-call'
    : damagePercent >= 0.85
      ? 'close-call'
      : 'unlikely';

  return {
    outcome,
    bossHp: normalizedBossHp,
    trainerCount: normalizedTrainerCount,
    subgroupCount: subgroups.length,
    lobbyDps,
    estimatedClearSeconds,
    survivalSeconds,
    limitingSeconds,
    damageBeforeLimit,
    damagePercent,
    estimatedMaxPhases,
    supportActionsPerGroup: Math.max(
      0,
      ...subgroups.map((group) => group.supportActions),
    ),
    limitedBySurvival:
      survivalSeconds < MAX_BATTLE_SIMULATION_CONSTANTS.enrageSeconds,
  };
};

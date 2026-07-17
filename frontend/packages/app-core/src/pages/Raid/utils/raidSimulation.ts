import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import {
  calculateRaidBossMoveDamage,
  calculateRaidBossStats,
  calculateRaidMoveDamage,
  getProcessedRaidMoveSeconds,
  getRaidMoveEnergy,
} from "./raidCombat";
import {
  getLegalRaidChargedMoves,
  getLegalRaidFastMoves,
} from "./raidCatalog";
import {
  RAID_MONTE_CARLO_MAX_SAMPLES,
  RAID_MONTE_CARLO_MIN_SAMPLES,
  PARTY_POWER_ACTIVATION_DELAY_SECONDS,
  PARTY_POWER_ACTIVE_CHARGED_MULTIPLIER,
  PARTY_POWER_METER_MAX,
  PARTY_POWER_POINTS_PER_MOVE,
  RAID_ATTACKER_TEAM_SIZE,
  RAID_SIMULATION_ATTACKER_SWAP_SECONDS,
  RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS,
  RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS,
  RAID_SIMULATION_DODGE_SECONDS,
  RAID_SIMULATION_ENERGY_CAP,
} from "./raidRules";
import { calculateRaidAttackerBattleStats } from "./raidTargetModel";
import type {
  RaidBattleSimulationResult,
  RaidBossMovesetMode,
  RaidCounterSettings,
  RaidSimulationDistribution,
  RaidTierPreset,
} from "./raidTypes";

type SimulationActor =
  | "attacker-start"
  | "attacker-hit"
  | "boss-start"
  | "boss-hit"
  | "attacker-spawn";

type SimulationEvent = {
  actor: SimulationActor;
  time: number;
  sequence: number;
  attackerGeneration: number;
  bossGeneration: number;
  move?: Move;
  dodged?: boolean;
  partyPowered?: boolean;
};

type BossMoveset = {
  fastMove: Move;
  chargedMove: Move;
};

export type RaidSimulationTeamMember = {
  attacker: PokemonVariant;
  fastMove: Move;
  chargedMove: Move;
};

const roundToRaidTurn = (seconds: number): number =>
  Math.round(seconds * 2) / 2;

const percentile = (values: number[], position: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const buildSimulationDistribution = (
  results: Array<
    Pick<
      RaidBattleSimulationResult,
      "projectedTimeToWinSeconds" | "faints" | "relobbies" | "won"
    >
  >,
): RaidSimulationDistribution => {
  const summarize = (values: number[]) => ({
    p10: percentile(values, 0.1),
    p50: percentile(values, 0.5),
    p90: percentile(values, 0.9),
  });

  return {
    sampleCount: results.length,
    winRate:
      results.length > 0
        ? results.filter((result) => result.won).length / results.length
        : 0,
    timeToWinSeconds: summarize(
      results.map((result) => result.projectedTimeToWinSeconds),
    ),
    faints: summarize(results.map((result) => result.faints)),
    relobbies: summarize(results.map((result) => result.relobbies)),
  };
};

const hashSeed = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: string): (() => number) => {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const averageSimulationResults = (
  results: RaidBattleSimulationResult[],
): RaidBattleSimulationResult => {
  const divisor = Math.max(1, results.length);
  const average = (select: (result: RaidBattleSimulationResult) => number) =>
    results.reduce((sum, result) => sum + select(result), 0) / divisor;

  return {
    damageDealt: average((result) => result.damageDealt),
    elapsedSeconds: average((result) => result.elapsedSeconds),
    dps: average((result) => result.dps),
    projectedTimeToWinSeconds: average(
      (result) => result.projectedTimeToWinSeconds,
    ),
    faints: average((result) => result.faints),
    relobbies: average((result) => result.relobbies),
    attackerChargedMoves: average((result) => result.attackerChargedMoves),
    bossChargedMoves: average((result) => result.bossChargedMoves),
    dodges: average((result) => result.dodges),
    partyPoweredChargedMoves: average(
      (result) => result.partyPoweredChargedMoves,
    ),
    won: results.every((result) => result.won),
    distribution: buildSimulationDistribution(results),
  };
};

export const simulateRaidTeamBattle = ({
  team,
  boss,
  bossFastMove,
  bossChargedMove,
  tier,
  settings,
  chargedDecisionOffset = 0,
  shouldBossUseCharged,
  getBossActionDelaySeconds,
  trainerCount = 1,
}: {
  team: RaidSimulationTeamMember[];
  boss: PokemonVariant;
  bossFastMove: Move;
  bossChargedMove: Move;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  chargedDecisionOffset?: 0 | 1;
  shouldBossUseCharged?: () => boolean;
  getBossActionDelaySeconds?: () => number;
  trainerCount?: number;
}): RaidBattleSimulationResult => {
  if (team.length === 0) {
    throw new Error("Raid simulation requires at least one team member.");
  }
  const bossStats = calculateRaidBossStats(
    boss,
    tier,
    settings.shadowBossMode,
  );
  const bossTypes = [boss.type1_name, boss.type2_name].filter(
    (type): type is string => Boolean(type && type !== "none"),
  );
  const activeTrainerCount = Math.max(1, Math.floor(trainerCount));
  const profiles = team.map(({ attacker, fastMove, chargedMove }) => {
    const attackerStats = calculateRaidAttackerBattleStats(attacker, settings);
    return {
      attacker,
      fastMove,
      chargedMove,
      attackerStats,
      fastDamage: calculateRaidMoveDamage({
        move: fastMove,
        attacker,
        attackerAttack: attackerStats.attack,
        bossDefense: bossStats.defense,
        bossTypes,
        settings,
        charged: false,
      }),
      chargedDamage: calculateRaidMoveDamage({
        move: chargedMove,
        attacker,
        attackerAttack: attackerStats.attack,
        bossDefense: bossStats.defense,
        bossTypes,
        settings,
        charged: true,
        partyPowerMultiplierOverride: 1,
      }),
      partyPoweredChargedDamage: calculateRaidMoveDamage({
        move: chargedMove,
        attacker,
        attackerAttack: attackerStats.attack,
        bossDefense: bossStats.defense,
        bossTypes,
        settings,
        charged: true,
        partyPowerMultiplierOverride:
          PARTY_POWER_ACTIVE_CHARGED_MULTIPLIER,
      }),
      bossFastDamage: calculateRaidBossMoveDamage({
        move: bossFastMove,
        boss,
        bossAttack: bossStats.attack,
        attacker,
        attackerDefense: attackerStats.defense,
        weatherBoostedType: settings.weatherBoostedType,
      }),
      bossChargedDamage: calculateRaidBossMoveDamage({
        move: bossChargedMove,
        boss,
        bossAttack: bossStats.attack,
        attacker,
        attackerDefense: attackerStats.defense,
        weatherBoostedType: settings.weatherBoostedType,
      }),
      dodgedBossChargedDamage: calculateRaidBossMoveDamage({
        move: bossChargedMove,
        boss,
        bossAttack: bossStats.attack,
        attacker,
        attackerDefense: attackerStats.defense,
        weatherBoostedType: settings.weatherBoostedType,
        dodged: true,
      }),
      chargedCost: Math.max(1, Math.abs(getRaidMoveEnergy(chargedMove))),
    };
  });
  const bossChargedCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(bossChargedMove)),
  );

  let bossHp = bossStats.hp;
  let bossEnergy = 0;
  let attackerHp = profiles[0].attackerStats.hp;
  let attackerEnergy = 0;
  let attackerGeneration = 0;
  let bossGeneration = 0;
  let teamPosition = 0;
  let faints = 0;
  let relobbies = 0;
  let attackerChargedMoves = 0;
  let bossChargedMoves = 0;
  let dodges = 0;
  let partyPoweredChargedMoves = 0;
  let bossChargedOpportunity = 0;
  let sequence = 0;
  let damageDealt = 0;
  let winTime: number | null = null;
  let reservedDodgeHitTime: number | null = null;
  let partyPowerMeter = 0;
  let partyPowerReadyAt: number | null = null;
  const events: SimulationEvent[] = [];
  const nextBossActionDelay = () =>
    getBossActionDelaySeconds?.() ??
    RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS;

  const enqueue = (
    actor: SimulationActor,
    time: number,
    move?: Move,
    dodged?: boolean,
    partyPowered?: boolean,
  ) => {
    events.push({
      actor,
      time: roundToRaidTurn(time),
      sequence: sequence++,
      attackerGeneration,
      bossGeneration,
      move,
      dodged,
      partyPowered,
    });
  };

  const takeNextEvent = (): SimulationEvent | undefined => {
    let selectedIndex = -1;
    for (let index = 0; index < events.length; index += 1) {
      const candidate = events[index];
      const selected = selectedIndex < 0 ? undefined : events[selectedIndex];
      if (
        !selected ||
        candidate.time < selected.time ||
        (candidate.time === selected.time &&
          candidate.sequence < selected.sequence)
      ) {
        selectedIndex = index;
      }
    }
    return selectedIndex < 0 ? undefined : events.splice(selectedIndex, 1)[0];
  };

  enqueue("attacker-start", 0);
  enqueue("boss-start", nextBossActionDelay());

  while (events.length > 0) {
    const event = takeNextEvent();
    if (!event || event.time > bossStats.timeLimitSeconds || winTime != null) {
      break;
    }
    if (
      event.attackerGeneration !== attackerGeneration ||
      event.bossGeneration !== bossGeneration
    ) {
      continue;
    }

    if (event.actor === "attacker-start") {
      const profile = profiles[teamPosition];
      const useCharged = attackerEnergy >= profile.chargedCost;
      const move = useCharged ? profile.chargedMove : profile.fastMove;
      const moveHitTime = roundToRaidTurn(
        event.time + getProcessedRaidMoveSeconds(move),
      );
      if (
        reservedDodgeHitTime != null &&
        moveHitTime > reservedDodgeHitTime
      ) {
        enqueue(
          "attacker-start",
          reservedDodgeHitTime + RAID_SIMULATION_DODGE_SECONDS,
        );
        continue;
      }
      attackerEnergy = useCharged
        ? Math.max(0, attackerEnergy - profile.chargedCost)
        : Math.min(
            RAID_SIMULATION_ENERGY_CAP,
            attackerEnergy + Math.max(0, getRaidMoveEnergy(profile.fastMove)),
          );
      const partyPowered =
        useCharged &&
        partyPowerReadyAt != null &&
        event.time >= partyPowerReadyAt;
      if (partyPowered) {
        partyPowerMeter = 0;
        partyPowerReadyAt = null;
      }
      enqueue(
        "attacker-hit",
        event.time + getProcessedRaidMoveSeconds(move),
        move,
        undefined,
        partyPowered,
      );
      continue;
    }

    if (event.actor === "attacker-hit") {
      const profile = profiles[teamPosition];
      const charged = event.move === profile.chargedMove;
      const damage = charged
        ? event.partyPowered
          ? profile.partyPoweredChargedDamage
          : profile.chargedDamage
        : profile.fastDamage;
      if (charged) attackerChargedMoves += 1;
      if (event.partyPowered) partyPoweredChargedMoves += 1;
      const bossHpBeforeDamage = bossHp;
      const groupDamage = damage * activeTrainerCount;
      bossHp = Math.max(0, bossHp - groupDamage);
      damageDealt += Math.min(groupDamage, bossHpBeforeDamage);
      bossEnergy = Math.min(
        RAID_SIMULATION_ENERGY_CAP,
        bossEnergy + Math.ceil(damage / 2) * activeTrainerCount,
      );
      const partyPowerPoints = PARTY_POWER_POINTS_PER_MOVE[settings.partyPower];
      if (partyPowerPoints > 0 && partyPowerReadyAt == null) {
        partyPowerMeter = Math.min(
          PARTY_POWER_METER_MAX,
          partyPowerMeter + partyPowerPoints,
        );
        if (partyPowerMeter >= PARTY_POWER_METER_MAX) {
          partyPowerReadyAt =
            event.time + PARTY_POWER_ACTIVATION_DELAY_SECONDS;
        }
      }
      if (bossHp <= 0) {
        winTime = event.time;
      } else {
        enqueue("attacker-start", event.time);
      }
      continue;
    }

    if (event.actor === "boss-start") {
      const chargedAvailable = bossEnergy >= bossChargedCost;
      const chargedDecision = chargedAvailable
        ? shouldBossUseCharged?.()
        : undefined;
      const useCharged =
        chargedAvailable &&
        (chargedDecision ??
          (bossChargedOpportunity++ + chargedDecisionOffset) % 2 === 1);
      const move = useCharged ? bossChargedMove : bossFastMove;
      bossEnergy = useCharged
        ? Math.max(0, bossEnergy - bossChargedCost)
        : Math.min(
            RAID_SIMULATION_ENERGY_CAP,
            bossEnergy + Math.max(0, getRaidMoveEnergy(bossFastMove)),
          );
      const bossHitTime = roundToRaidTurn(
        event.time + getProcessedRaidMoveSeconds(move),
      );
      const attackerMoveOverlapsHit = events.some(
        (queuedEvent) =>
          queuedEvent.actor === "attacker-hit" &&
          queuedEvent.attackerGeneration === attackerGeneration &&
          queuedEvent.time > bossHitTime,
      );
      const willDodge =
        useCharged &&
        settings.dodgeStrategy === "charged" &&
        !attackerMoveOverlapsHit;
      if (willDodge) reservedDodgeHitTime = bossHitTime;
      enqueue("boss-hit", bossHitTime, move, willDodge);
      continue;
    }

    if (event.actor === "boss-hit") {
      const profile = profiles[teamPosition];
      const charged = event.move === bossChargedMove;
      const damage = charged
        ? event.dodged
          ? profile.dodgedBossChargedDamage
          : profile.bossChargedDamage
        : profile.bossFastDamage;
      if (charged) bossChargedMoves += 1;
      if (event.dodged) dodges += 1;
      if (reservedDodgeHitTime === event.time) reservedDodgeHitTime = null;
      attackerHp -= damage;
      attackerEnergy = Math.min(
        RAID_SIMULATION_ENERGY_CAP,
        attackerEnergy + Math.ceil(damage / 2),
      );

      if (attackerHp <= 0) {
        faints += 1;
        teamPosition = (teamPosition + 1) % profiles.length;
        attackerGeneration += 1;
        bossGeneration += 1;
        const needsRelobby = teamPosition === 0;
        if (needsRelobby) relobbies += 1;
        enqueue(
          "attacker-spawn",
          event.time +
            (needsRelobby
              ? Math.max(0, settings.relobbySeconds)
              : RAID_SIMULATION_ATTACKER_SWAP_SECONDS),
        );
      } else {
        enqueue("boss-start", event.time + nextBossActionDelay());
      }
      continue;
    }

    attackerHp = profiles[teamPosition].attackerStats.hp;
    attackerEnergy = 0;
    enqueue("attacker-start", event.time);
    enqueue("boss-start", event.time + nextBossActionDelay());
  }

  const elapsedSeconds = winTime ?? bossStats.timeLimitSeconds;
  const dps = elapsedSeconds > 0 ? damageDealt / elapsedSeconds : 0;

  const result = {
    damageDealt,
    elapsedSeconds,
    dps,
    projectedTimeToWinSeconds:
      winTime ?? (dps > 0 ? bossStats.hp / dps : Number.POSITIVE_INFINITY),
    faints,
    relobbies,
    attackerChargedMoves,
    bossChargedMoves,
    dodges,
    partyPoweredChargedMoves,
    won: winTime != null,
  };
  return {
    ...result,
    distribution: buildSimulationDistribution([result]),
  };
};

export const simulateRaidBattle = ({
  attacker,
  attackerFastMove,
  attackerChargedMove,
  ...battle
}: {
  attacker: PokemonVariant;
  attackerFastMove: Move;
  attackerChargedMove: Move;
  boss: PokemonVariant;
  bossFastMove: Move;
  bossChargedMove: Move;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  chargedDecisionOffset?: 0 | 1;
  shouldBossUseCharged?: () => boolean;
  getBossActionDelaySeconds?: () => number;
  trainerCount?: number;
}): RaidBattleSimulationResult =>
  simulateRaidTeamBattle({
    ...battle,
    team: Array.from({ length: RAID_ATTACKER_TEAM_SIZE }, () => ({
      attacker,
      fastMove: attackerFastMove,
      chargedMove: attackerChargedMove,
    })),
  });

const getBossMovesets = (boss: PokemonVariant): BossMoveset[] =>
  getLegalRaidFastMoves(boss).flatMap((fastMove) =>
    getLegalRaidChargedMoves(boss).map((chargedMove) => ({
      fastMove,
      chargedMove,
    })),
  );

const selectBossMovesetSimulation = (
  resultsByMoveset: RaidBattleSimulationResult[][],
  mode: RaidBossMovesetMode,
): RaidBattleSimulationResult => {
  if (mode === "expected") {
    return averageSimulationResults(resultsByMoveset.flat());
  }

  const results = resultsByMoveset.map(averageSimulationResults);
  return results.reduce((selected, candidate) => {
    const timeDifference =
      candidate.projectedTimeToWinSeconds - selected.projectedTimeToWinSeconds;
    if (timeDifference !== 0) {
      const candidateWins =
        mode === "favorable" ? timeDifference < 0 : timeDifference > 0;
      return candidateWins ? candidate : selected;
    }
    const candidateWins =
      mode === "favorable"
        ? candidate.faints < selected.faints
        : candidate.faints > selected.faints;
    return candidateWins ? candidate : selected;
  });
};

export const simulateRaidTeamAcrossBossMovesets = ({
  team,
  boss,
  tier,
  settings,
  trainerCount = 1,
}: {
  team: RaidSimulationTeamMember[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  trainerCount?: number;
}): RaidBattleSimulationResult | null => {
  const movesets = getBossMovesets(boss);
  if (movesets.length === 0 || team.length === 0) return null;

  if (settings.bossMovesetMode === "monte-carlo") {
    const sampleCount = Math.min(
      RAID_MONTE_CARLO_MAX_SAMPLES,
      Math.max(RAID_MONTE_CARLO_MIN_SAMPLES, movesets.length * 2),
    );
    const teamSeed = team
      .map(
        ({ attacker, fastMove, chargedMove }) =>
          `${attacker.variant_id}:${fastMove.name}:${chargedMove.name}`,
      )
      .join(",");
    const results = Array.from({ length: sampleCount }, (_, sampleIndex) => {
      const moveset = movesets[sampleIndex % movesets.length];
      const random = createSeededRandom(
        `${boss.variant_id}|${tier.key}|${teamSeed}|${sampleIndex}`,
      );
      return simulateRaidTeamBattle({
        team,
        boss,
        bossFastMove: moveset.fastMove,
        bossChargedMove: moveset.chargedMove,
        tier,
        settings,
        trainerCount,
        shouldBossUseCharged: () => random() < 0.5,
        getBossActionDelaySeconds: () => {
          const index = Math.min(
            RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS.length - 1,
            Math.floor(
              random() * RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS.length,
            ),
          );
          return RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS[index];
        },
      });
    });
    return averageSimulationResults(results);
  }

  const resultsByMoveset = movesets.map(({ fastMove, chargedMove }) =>
    ([0, 1] as const).map((chargedDecisionOffset) =>
      simulateRaidTeamBattle({
        team,
        boss,
        bossFastMove: fastMove,
        bossChargedMove: chargedMove,
        tier,
        settings,
        trainerCount,
        chargedDecisionOffset,
      }),
    ),
  );
  return selectBossMovesetSimulation(
    resultsByMoveset,
    settings.bossMovesetMode,
  );
};

const simulateMonteCarloRaidCounter = ({
  attacker,
  attackerFastMove,
  attackerChargedMove,
  boss,
  tier,
  settings,
  movesets,
}: {
  attacker: PokemonVariant;
  attackerFastMove: Move;
  attackerChargedMove: Move;
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  movesets: BossMoveset[];
}): RaidBattleSimulationResult => {
  const sampleCount = Math.min(
    RAID_MONTE_CARLO_MAX_SAMPLES,
    Math.max(RAID_MONTE_CARLO_MIN_SAMPLES, movesets.length * 2),
  );
  const sharedSeed = [
    boss.variant_id,
    boss.pokemon_id,
    tier.key,
    settings.attackerLevel,
    settings.friendship,
    settings.megaAllyBonus,
    settings.partyPower,
    settings.dodgeStrategy,
    settings.weatherBoostedType,
    settings.shadowBossMode,
    settings.relobbySeconds,
  ].join("|");
  const results = Array.from({ length: sampleCount }, (_, sampleIndex) => {
    const moveset = movesets[sampleIndex % movesets.length];
    const random = createSeededRandom(`${sharedSeed}|${sampleIndex}`);
    return simulateRaidBattle({
      attacker,
      attackerFastMove,
      attackerChargedMove,
      boss,
      bossFastMove: moveset.fastMove,
      bossChargedMove: moveset.chargedMove,
      tier,
      settings,
      shouldBossUseCharged: () => random() < 0.5,
      getBossActionDelaySeconds: () => {
        const index = Math.min(
          RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS.length - 1,
          Math.floor(
            random() * RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS.length,
          ),
        );
        return RAID_SIMULATION_BOSS_DELAY_OPTIONS_SECONDS[index];
      },
    });
  });

  return averageSimulationResults(results);
};

export const simulateRaidCounterAcrossBossMovesets = ({
  attacker,
  attackerFastMove,
  attackerChargedMove,
  boss,
  tier,
  settings,
}: {
  attacker: PokemonVariant;
  attackerFastMove: Move;
  attackerChargedMove: Move;
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
}): RaidBattleSimulationResult | null => {
  const movesets = getBossMovesets(boss);
  if (movesets.length === 0) return null;

  if (settings.bossMovesetMode === "monte-carlo") {
    return simulateMonteCarloRaidCounter({
      attacker,
      attackerFastMove,
      attackerChargedMove,
      boss,
      tier,
      settings,
      movesets,
    });
  }

  const resultsByMoveset = movesets.map(({ fastMove, chargedMove }) =>
    ([0, 1] as const).map((chargedDecisionOffset) =>
      simulateRaidBattle({
        attacker,
        attackerFastMove,
        attackerChargedMove,
        boss,
        bossFastMove: fastMove,
        bossChargedMove: chargedMove,
        tier,
        settings,
        chargedDecisionOffset,
      }),
    ),
  );

  return selectBossMovesetSimulation(
    resultsByMoveset,
    settings.bossMovesetMode,
  );
};

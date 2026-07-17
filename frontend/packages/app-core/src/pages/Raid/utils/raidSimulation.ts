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
  RAID_SIMULATION_ATTACKER_SWAP_SECONDS,
  RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS,
  RAID_SIMULATION_ENERGY_CAP,
} from "./raidRules";
import { calculateRaidAttackerBattleStats } from "./raidTargetModel";
import type {
  RaidBattleSimulationResult,
  RaidBossMovesetMode,
  RaidCounterSettings,
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
};

type BossMoveset = {
  fastMove: Move;
  chargedMove: Move;
};

const roundToRaidTurn = (seconds: number): number =>
  Math.round(seconds * 2) / 2;

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
    won: results.every((result) => result.won),
  };
};

export const simulateRaidBattle = ({
  attacker,
  attackerFastMove,
  attackerChargedMove,
  boss,
  bossFastMove,
  bossChargedMove,
  tier,
  settings,
  chargedDecisionOffset = 0,
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
}): RaidBattleSimulationResult => {
  const attackerStats = calculateRaidAttackerBattleStats(attacker, settings);
  const bossStats = calculateRaidBossStats(
    boss,
    tier,
    settings.shadowBossMode,
  );
  const attackerFastDamage = calculateRaidMoveDamage({
    move: attackerFastMove,
    attacker,
    attackerAttack: attackerStats.attack,
    bossDefense: bossStats.defense,
    bossTypes: [boss.type1_name, boss.type2_name].filter(
      (type): type is string => Boolean(type && type !== "none"),
    ),
    settings,
    charged: false,
  });
  const attackerChargedDamage = calculateRaidMoveDamage({
    move: attackerChargedMove,
    attacker,
    attackerAttack: attackerStats.attack,
    bossDefense: bossStats.defense,
    bossTypes: [boss.type1_name, boss.type2_name].filter(
      (type): type is string => Boolean(type && type !== "none"),
    ),
    settings,
    charged: true,
  });
  const bossFastDamage = calculateRaidBossMoveDamage({
    move: bossFastMove,
    boss,
    bossAttack: bossStats.attack,
    attacker,
    attackerDefense: attackerStats.defense,
    weatherBoostedType: settings.weatherBoostedType,
  });
  const bossChargedDamage = calculateRaidBossMoveDamage({
    move: bossChargedMove,
    boss,
    bossAttack: bossStats.attack,
    attacker,
    attackerDefense: attackerStats.defense,
    weatherBoostedType: settings.weatherBoostedType,
  });
  const attackerChargedCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(attackerChargedMove)),
  );
  const bossChargedCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(bossChargedMove)),
  );

  let bossHp = bossStats.hp;
  let bossEnergy = 0;
  let attackerHp = attackerStats.hp;
  let attackerEnergy = 0;
  let attackerGeneration = 0;
  let bossGeneration = 0;
  let teamPosition = 0;
  let faints = 0;
  let relobbies = 0;
  let attackerChargedMoves = 0;
  let bossChargedMoves = 0;
  let bossChargedOpportunity = 0;
  let sequence = 0;
  let damageDealt = 0;
  let winTime: number | null = null;
  const events: SimulationEvent[] = [];

  const enqueue = (
    actor: SimulationActor,
    time: number,
    move?: Move,
  ) => {
    events.push({
      actor,
      time: roundToRaidTurn(time),
      sequence: sequence++,
      attackerGeneration,
      bossGeneration,
      move,
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
  enqueue("boss-start", RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS);

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
      const useCharged = attackerEnergy >= attackerChargedCost;
      const move = useCharged ? attackerChargedMove : attackerFastMove;
      attackerEnergy = useCharged
        ? Math.max(0, attackerEnergy - attackerChargedCost)
        : Math.min(
            RAID_SIMULATION_ENERGY_CAP,
            attackerEnergy + Math.max(0, getRaidMoveEnergy(attackerFastMove)),
          );
      enqueue(
        "attacker-hit",
        event.time + getProcessedRaidMoveSeconds(move),
        move,
      );
      continue;
    }

    if (event.actor === "attacker-hit") {
      const charged = event.move === attackerChargedMove;
      const damage = charged ? attackerChargedDamage : attackerFastDamage;
      if (charged) attackerChargedMoves += 1;
      const bossHpBeforeDamage = bossHp;
      bossHp = Math.max(0, bossHp - damage);
      damageDealt += Math.min(damage, bossHpBeforeDamage);
      bossEnergy = Math.min(
        RAID_SIMULATION_ENERGY_CAP,
        bossEnergy + Math.ceil(damage / 2),
      );
      if (bossHp <= 0) {
        winTime = event.time;
      } else {
        enqueue("attacker-start", event.time);
      }
      continue;
    }

    if (event.actor === "boss-start") {
      const chargedAvailable = bossEnergy >= bossChargedCost;
      const useCharged =
        chargedAvailable &&
        (bossChargedOpportunity++ + chargedDecisionOffset) % 2 === 1;
      const move = useCharged ? bossChargedMove : bossFastMove;
      bossEnergy = useCharged
        ? Math.max(0, bossEnergy - bossChargedCost)
        : Math.min(
            RAID_SIMULATION_ENERGY_CAP,
            bossEnergy + Math.max(0, getRaidMoveEnergy(bossFastMove)),
          );
      enqueue(
        "boss-hit",
        event.time + getProcessedRaidMoveSeconds(move),
        move,
      );
      continue;
    }

    if (event.actor === "boss-hit") {
      const charged = event.move === bossChargedMove;
      const damage = charged ? bossChargedDamage : bossFastDamage;
      if (charged) bossChargedMoves += 1;
      attackerHp -= damage;
      attackerEnergy = Math.min(
        RAID_SIMULATION_ENERGY_CAP,
        attackerEnergy + Math.ceil(damage / 2),
      );

      if (attackerHp <= 0) {
        faints += 1;
        teamPosition = (teamPosition + 1) % 6;
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
        enqueue(
          "boss-start",
          event.time + RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS,
        );
      }
      continue;
    }

    attackerHp = attackerStats.hp;
    attackerEnergy = 0;
    enqueue("attacker-start", event.time);
    enqueue(
      "boss-start",
      event.time + RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS,
    );
  }

  const elapsedSeconds = winTime ?? bossStats.timeLimitSeconds;
  const dps = elapsedSeconds > 0 ? damageDealt / elapsedSeconds : 0;

  return {
    damageDealt,
    elapsedSeconds,
    dps,
    projectedTimeToWinSeconds:
      winTime ?? (dps > 0 ? bossStats.hp / dps : Number.POSITIVE_INFINITY),
    faints,
    relobbies,
    attackerChargedMoves,
    bossChargedMoves,
    won: winTime != null,
  };
};

const getBossMovesets = (boss: PokemonVariant): BossMoveset[] =>
  getLegalRaidFastMoves(boss).flatMap((fastMove) =>
    getLegalRaidChargedMoves(boss).map((chargedMove) => ({
      fastMove,
      chargedMove,
    })),
  );

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

  const results = movesets.map(({ fastMove, chargedMove }) =>
    averageSimulationResults(
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
    ),
  );

  if (settings.bossMovesetMode === "expected") {
    return averageSimulationResults(results);
  }

  const compare = (
    candidate: RaidBattleSimulationResult,
    current: RaidBattleSimulationResult,
    mode: RaidBossMovesetMode,
  ) => {
    const timeDifference =
      candidate.projectedTimeToWinSeconds - current.projectedTimeToWinSeconds;
    if (timeDifference !== 0) {
      return mode === "favorable" ? timeDifference < 0 : timeDifference > 0;
    }
    return mode === "favorable"
      ? candidate.faints < current.faints
      : candidate.faints > current.faints;
  };

  return results.reduce((selected, candidate) =>
    compare(candidate, selected, settings.bossMovesetMode)
      ? candidate
      : selected,
  );
};

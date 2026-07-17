import { describe, expect, it, vi } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import {
  scoreRaidCounters,
  simulateRaidBattle,
  simulateRaidCounterAcrossBossMovesets,
  simulateRaidTeamBattle,
  type RaidCounterSettings,
  type RaidTierPreset,
} from "@/pages/Raid/utils/raidCalculations";
import { RAID_COUNTER_SIMULATION_VARIANT_LIMIT } from "@/pages/Raid/utils/raidRules";
import {
  buildRaidCounterWorkerChunks,
  scoreRaidCountersAsync,
} from "@/pages/Raid/utils/raidCounterWorkers";

const move = (
  name: string,
  type: string,
  isFast: boolean,
  power: number,
  durationMs: number,
  energy: number,
): Move =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast ? 1 : 0,
    raid_power: power,
    raid_cooldown: durationMs,
    raid_energy: energy,
    fusion_id: null,
  }) as unknown as Move;

const pokemon = ({
  name,
  attack,
  defense,
  stamina,
  types,
  moves,
}: {
  name: string;
  attack: number;
  defense: number;
  stamina: number;
  types: [string, string?];
  moves: Move[];
}): PokemonVariant =>
  ({
    pokemon_id: name.length,
    pokedex_number: name.length,
    name,
    species_name: name,
    variant_id: `${name.toLowerCase().replaceAll(" ", "-")}-default`,
    variantType: "default",
    attack,
    defense,
    stamina,
    type1_name: types[0],
    type2_name: types[1] ?? "none",
    moves,
    currentImage: "",
    image_url: "",
    sprite_url: "",
    backgrounds: [],
    raid_boss: [],
    fusion_id: null,
  }) as unknown as PokemonVariant;

const fastAttack = move("Fast Attack", "normal", true, 10, 500, 10);
const chargedAttack = move(
  "Charged Attack",
  "normal",
  false,
  100,
  1000,
  -50,
);
const weakBossFast = move("Weak Fast", "normal", true, 4, 500, 10);
const weakBossCharged = move(
  "Weak Charged",
  "normal",
  false,
  25,
  1000,
  -50,
);
const strongBossCharged = move(
  "Strong Charged",
  "fighting",
  false,
  180,
  1000,
  -50,
);

const attacker = pokemon({
  name: "Test Attacker",
  attack: 260,
  defense: 160,
  stamina: 170,
  types: ["normal"],
  moves: [fastAttack, chargedAttack],
});
const boss = pokemon({
  name: "Test Boss",
  attack: 240,
  defense: 180,
  stamina: 200,
  types: ["normal"],
  moves: [weakBossFast, weakBossCharged, strongBossCharged],
});

const tier: RaidTierPreset = {
  key: "tier3",
  label: "Test Raid",
  shortLabel: "Test",
  bossHp: 3600,
  bossStatMultiplier: 0.73,
  timeLimitSeconds: 180,
  note: "Test tier",
};

const settings: RaidCounterSettings = {
  attackerLevel: "50.0",
  friendship: "none",
  megaAllyBonus: "none",
  partyPower: "none",
  dodgeStrategy: "none",
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
};

describe("raid event simulation", () => {
  it("resolves actions on half-second turns and completes a winnable raid", () => {
    const result = simulateRaidBattle({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      bossFastMove: weakBossFast,
      bossChargedMove: weakBossCharged,
      tier: { ...tier, bossHp: 400 },
      settings,
    });

    expect(result.won).toBe(true);
    expect(result.damageDealt).toBe(400);
    expect(result.elapsedSeconds * 2).toBe(
      Math.round(result.elapsedSeconds * 2),
    );
    expect(result.projectedTimeToWinSeconds).toBe(result.elapsedSeconds);
  });

  it("lets damage taken generate energy for the attacker", () => {
    const gentleBoss = pokemon({
      name: "Energy Boss",
      attack: 100,
      defense: 220,
      stamina: 300,
      types: ["normal"],
      moves: [
        move("Energy Fast", "normal", true, 40, 500, 10),
        weakBossCharged,
      ],
    });
    const lowEnergyFast = move("Slow Energy", "normal", true, 5, 1000, 1);
    const result = simulateRaidBattle({
      attacker: { ...attacker, moves: [lowEnergyFast, chargedAttack] },
      attackerFastMove: lowEnergyFast,
      attackerChargedMove: chargedAttack,
      boss: gentleBoss,
      bossFastMove: gentleBoss.moves[0],
      bossChargedMove: weakBossCharged,
      tier: { ...tier, bossHp: 900, timeLimitSeconds: 20 },
      settings,
    });

    expect(result.damageDealt).toBeGreaterThan(0);
    expect(result.attackerChargedMoves).toBeGreaterThan(0);
  });

  it("commits move energy at start so damage energy can be banked during an animation", () => {
    const instantEnergyFast = move(
      "Instant Energy",
      "normal",
      true,
      5,
      500,
      100,
    );
    const longChargedMove = move(
      "Long Charged",
      "normal",
      false,
      50,
      4000,
      -100,
    );
    const energyFeedingBoss = pokemon({
      name: "Energy Feeding Boss",
      attack: 1000,
      defense: 220,
      stamina: 300,
      types: ["normal"],
      moves: [
        move("Heavy Fast", "normal", true, 1000, 500, 10),
        weakBossCharged,
      ],
    });
    const durableAttacker = pokemon({
      name: "Durable Attacker",
      attack: 260,
      defense: 1000,
      stamina: 5000,
      types: ["normal"],
      moves: [instantEnergyFast, longChargedMove],
    });
    const result = simulateRaidBattle({
      attacker: durableAttacker,
      attackerFastMove: instantEnergyFast,
      attackerChargedMove: longChargedMove,
      boss: energyFeedingBoss,
      bossFastMove: energyFeedingBoss.moves[0],
      bossChargedMove: weakBossCharged,
      tier: { ...tier, bossHp: 900, timeLimitSeconds: 8.5 },
      settings,
    });

    expect(result.attackerChargedMoves).toBe(2);
  });

  it("cancels a queued attack when its attacker faints before the hit", () => {
    const instantEnergyFast = move(
      "Instant Energy",
      "normal",
      true,
      5,
      500,
      100,
    );
    const longChargedMove = move(
      "Interrupted Charged",
      "normal",
      false,
      500,
      4000,
      -100,
    );
    const fragileAttacker = pokemon({
      name: "Interrupted Attacker",
      attack: 260,
      defense: 20,
      stamina: 20,
      types: ["normal"],
      moves: [instantEnergyFast, longChargedMove],
    });
    const crushingFast = move(
      "Interrupting Fast",
      "fighting",
      true,
      500,
      500,
      10,
    );
    const crushingBoss = pokemon({
      name: "Interrupting Boss",
      attack: 500,
      defense: 220,
      stamina: 300,
      types: ["fighting"],
      moves: [crushingFast, strongBossCharged],
    });

    const result = simulateRaidBattle({
      attacker: fragileAttacker,
      attackerFastMove: instantEnergyFast,
      attackerChargedMove: longChargedMove,
      boss: crushingBoss,
      bossFastMove: crushingFast,
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 3.5 },
      settings,
    });

    expect(result.faints).toBe(1);
    expect(result.attackerChargedMoves).toBe(0);
  });

  it("dodges charged damage when the attacker can reach the damage window", () => {
    const durableAttacker = pokemon({
      name: "Dodge Attacker",
      attack: 220,
      defense: 220,
      stamina: 400,
      types: ["normal"],
      moves: [fastAttack, chargedAttack],
    });
    const chargedBoss = pokemon({
      name: "Charged Boss",
      attack: 320,
      defense: 220,
      stamina: 400,
      types: ["fighting"],
      moves: [weakBossFast, strongBossCharged],
    });
    const sharedInput = {
      attacker: durableAttacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss: chargedBoss,
      bossFastMove: weakBossFast,
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 45 },
      shouldBossUseCharged: () => true,
    };
    const noDodge = simulateRaidBattle({
      ...sharedInput,
      settings,
    });
    const dodgeCharged = simulateRaidBattle({
      ...sharedInput,
      settings: { ...settings, dodgeStrategy: "charged" },
    });

    expect(dodgeCharged.dodges).toBeGreaterThan(0);
    expect(dodgeCharged.faints).toBeLessThan(noDodge.faints);
    expect(dodgeCharged.damageDealt).toBeLessThan(noDodge.damageDealt);
  });

  it("charges relobby downtime after every six faints", () => {
    const fragileAttacker = pokemon({
      name: "Fragile Attacker",
      attack: 180,
      defense: 20,
      stamina: 20,
      types: ["normal"],
      moves: [fastAttack, chargedAttack],
    });
    const crushingBoss = pokemon({
      name: "Crushing Boss",
      attack: 500,
      defense: 220,
      stamina: 300,
      types: ["fighting"],
      moves: [
        move("Crushing Fast", "fighting", true, 100, 500, 10),
        strongBossCharged,
      ],
    });
    const noDelay = simulateRaidBattle({
      attacker: fragileAttacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss: crushingBoss,
      bossFastMove: crushingBoss.moves[0],
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 90 },
      settings: { ...settings, relobbySeconds: 0 },
    });
    const delayed = simulateRaidBattle({
      attacker: fragileAttacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss: crushingBoss,
      bossFastMove: crushingBoss.moves[0],
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 90 },
      settings: { ...settings, relobbySeconds: 20 },
    });

    expect(noDelay.relobbies).toBeGreaterThan(0);
    expect(delayed.relobbies).toBeGreaterThan(0);
    expect(delayed.damageDealt).toBeLessThan(noDelay.damageDealt);
    expect(delayed.projectedTimeToWinSeconds).toBeGreaterThan(
      noDelay.projectedTimeToWinSeconds,
    );
  });

  it("advances through each member of a mixed team with its own battle stats", () => {
    const lead = pokemon({
      name: "Glass Lead",
      attack: 350,
      defense: 30,
      stamina: 30,
      types: ["normal"],
      moves: [fastAttack, chargedAttack],
    });
    const anchorFast = move("Anchor Fast", "normal", true, 7, 500, 10);
    const anchorCharged = move(
      "Anchor Charged",
      "normal",
      false,
      70,
      1000,
      -50,
    );
    const anchor = pokemon({
      name: "Durable Anchor",
      attack: 170,
      defense: 500,
      stamina: 700,
      types: ["normal"],
      moves: [anchorFast, anchorCharged],
    });
    const crushingFast = move(
      "Team Crushing Fast",
      "fighting",
      true,
      120,
      500,
      10,
    );
    const mixed = simulateRaidTeamBattle({
      team: [
        { attacker: lead, fastMove: fastAttack, chargedMove: chargedAttack },
        {
          attacker: anchor,
          fastMove: anchorFast,
          chargedMove: anchorCharged,
        },
      ],
      boss,
      bossFastMove: crushingFast,
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 20 },
      settings,
    });
    const repeatedLead = simulateRaidBattle({
      attacker: lead,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      bossFastMove: crushingFast,
      bossChargedMove: strongBossCharged,
      tier: { ...tier, bossHp: 5000, timeLimitSeconds: 20 },
      settings,
    });

    expect(mixed.faints).toBeGreaterThan(0);
    expect(mixed.faints).toBeLessThan(repeatedLead.faints);
    expect(mixed.damageDealt).not.toBe(repeatedLead.damageDealt);
  });

  it("selects genuinely favorable and hostile legal boss movesets", () => {
    const expected = simulateRaidCounterAcrossBossMovesets({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      tier,
      settings,
    });
    const favorable = simulateRaidCounterAcrossBossMovesets({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      tier,
      settings: { ...settings, bossMovesetMode: "favorable" },
    });
    const hostile = simulateRaidCounterAcrossBossMovesets({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      tier,
      settings: { ...settings, bossMovesetMode: "hostile" },
    });

    expect(expected).not.toBeNull();
    expect(favorable).not.toBeNull();
    expect(hostile).not.toBeNull();
    expect(favorable!.projectedTimeToWinSeconds).toBeLessThanOrEqual(
      expected!.projectedTimeToWinSeconds,
    );
    expect(expected!.projectedTimeToWinSeconds).toBeLessThanOrEqual(
      hostile!.projectedTimeToWinSeconds,
    );
    expect(favorable!.faints).toBeLessThanOrEqual(hostile!.faints);
  });

  it("produces reproducible Monte Carlo percentiles", () => {
    const monteCarloSettings: RaidCounterSettings = {
      ...settings,
      bossMovesetMode: "monte-carlo",
    };
    const first = simulateRaidCounterAcrossBossMovesets({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      tier,
      settings: monteCarloSettings,
    });
    const second = simulateRaidCounterAcrossBossMovesets({
      attacker,
      attackerFastMove: fastAttack,
      attackerChargedMove: chargedAttack,
      boss,
      tier,
      settings: monteCarloSettings,
    });

    expect(first).toEqual(second);
    expect(first).not.toBeNull();
    expect(first!.distribution.sampleCount).toBeGreaterThanOrEqual(24);
    expect(first!.distribution.sampleCount).toBeLessThanOrEqual(48);
    expect(first!.distribution.winRate).toBeGreaterThanOrEqual(0);
    expect(first!.distribution.winRate).toBeLessThanOrEqual(1);
    expect(first!.distribution.timeToWinSeconds.p10).toBeLessThanOrEqual(
      first!.distribution.timeToWinSeconds.p50,
    );
    expect(first!.distribution.timeToWinSeconds.p50).toBeLessThanOrEqual(
      first!.distribution.timeToWinSeconds.p90,
    );
    expect(first!.distribution.faints.p10).toBeLessThanOrEqual(
      first!.distribution.faints.p90,
    );
  });

  it("attaches Monte Carlo outcomes to ranked counters", () => {
    const scores = scoreRaidCounters(
      [attacker],
      boss,
      tier,
      { ...settings, bossMovesetMode: "monte-carlo" },
    );

    expect(scores).toHaveLength(1);
    expect(scores[0].simulationDistribution?.sampleCount).toBeGreaterThanOrEqual(
      24,
    );
    expect(
      Number.isFinite(
        scores[0].simulationDistribution?.timeToWinSeconds.p50 ?? NaN,
      ),
    ).toBe(true);
  });

  it("keeps a practical Monte Carlo counter batch bounded and complete", () => {
    const candidates = Array.from({ length: 32 }, (_, index) =>
      pokemon({
        name: `Monte Carlo Candidate ${index.toString().padStart(2, "0")}`,
        attack: 300 - index,
        defense: 160,
        stamina: 170,
        types: ["normal"],
        moves: [fastAttack, chargedAttack],
      }),
    );

    const scores = scoreRaidCounters(candidates, boss, tier, {
      ...settings,
      bossMovesetMode: "monte-carlo",
    });

    expect(scores).toHaveLength(candidates.length);
    expect(
      scores.every(
        (score) =>
          (score.simulationDistribution?.sampleCount ?? 0) >= 24 &&
          Number.isFinite(
            score.simulationDistribution?.timeToWinSeconds.p50 ?? NaN,
          ),
      ),
    ).toBe(true);
  });

  it("sends every legal finalist moveset through the event simulator", () => {
    const alternateFast = move("Alternate Fast", "normal", true, 8, 500, 12);
    const alternateCharged = move(
      "Alternate Charged",
      "normal",
      false,
      80,
      500,
      -33,
    );
    const flexibleAttacker = pokemon({
      name: "Flexible Attacker",
      attack: 260,
      defense: 160,
      stamina: 170,
      types: ["normal"],
      moves: [
        fastAttack,
        alternateFast,
        chargedAttack,
        alternateCharged,
      ],
    });

    const scores = scoreRaidCounters(
      [flexibleAttacker],
      boss,
      tier,
      settings,
    );

    expect(scores).toHaveLength(4);
    expect(
      new Set(
        scores.map(
          (score) => `${score.fastMove.name}/${score.chargedMove.name}`,
        ),
      ).size,
    ).toBe(4);
    expect(scores.every((score) => score.simulationDistribution)).toBe(true);
  });

  it("balances costly finalist forms across calculation workers", () => {
    const alternateFast = move("Alternate Fast", "normal", true, 8, 500, 12);
    const alternateCharged = move(
      "Alternate Charged",
      "normal",
      false,
      80,
      500,
      -33,
    );
    const finalists = [
      pokemon({
        name: "Flexible A",
        attack: 260,
        defense: 160,
        stamina: 170,
        types: ["normal"],
        moves: [
          fastAttack,
          alternateFast,
          chargedAttack,
          alternateCharged,
        ],
      }),
      pokemon({
        name: "Flexible B",
        attack: 259,
        defense: 160,
        stamina: 170,
        types: ["normal"],
        moves: [
          fastAttack,
          alternateFast,
          chargedAttack,
          alternateCharged,
        ],
      }),
      attacker,
      { ...attacker, name: "Simple B", variant_id: "simple-b" },
    ];

    const chunks = buildRaidCounterWorkerChunks(finalists, 2);

    expect(chunks).toHaveLength(2);
    expect(chunks.flat()).toHaveLength(finalists.length);
    expect(chunks.every((chunk) => chunk.length === 2)).toBe(true);
  });

  it("matches synchronous scoring when workers are unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    try {
      const asyncScores = await scoreRaidCountersAsync(
        [attacker],
        boss,
        tier,
        settings,
        true,
      );
      const syncScores = scoreRaidCounters([attacker], boss, tier, settings);

      expect(asyncScores).toEqual(syncScores);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("bounds the variants sent through the event simulator", () => {
    const candidates = Array.from(
      { length: RAID_COUNTER_SIMULATION_VARIANT_LIMIT + 44 },
      (_, index) =>
        pokemon({
          name: `Candidate ${index.toString().padStart(3, "0")}`,
          attack: 400 - index * 0.5,
          defense: 160,
          stamina: 170,
          types: ["normal"],
          moves: [fastAttack, chargedAttack],
        }),
    );

    const scores = scoreRaidCounters(candidates, boss, tier, settings);

    expect(scores).toHaveLength(RAID_COUNTER_SIMULATION_VARIANT_LIMIT);
    expect(scores.every((score) => Number.isFinite(score.dps))).toBe(true);
    expect(scores.every((score) => score.dps > 0)).toBe(true);
  });
});

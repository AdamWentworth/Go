import { describe, expect, it } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import {
  buildRaidPartyTeamCandidates,
  optimizeRaidParty,
} from "@/pages/Raid/utils/raidPartyOptimizer";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidPartySimulationResult,
  RaidPartyTrainer,
  RaidSimulationTeamMember,
  RaidTierPreset,
} from "@/pages/Raid/utils/raidTypes";

const settings = {
  attackerLevel: "50.0",
  friendship: "best",
  megaAllyBonus: "none",
  partyPower: "party2",
  dodgeStrategy: "none",
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
} satisfies RaidCounterSettings;

const score = (
  id: string,
  dps: number,
  variantType: "default" | "mega" = "default",
): RaidCounterScore =>
  ({
    variant: {
      variant_id: id,
      variantType,
      name: id,
      species_name: id,
    } as PokemonVariant,
    fastMove: { name: `${id} Fast` },
    chargedMove: { name: `${id} Charged` },
    dps,
    soloTimeSeconds: 200 - dps,
    faints: 6,
    relobbies: 0,
  }) as RaidCounterScore;

const member = (candidate: RaidCounterScore): RaidSimulationTeamMember => ({
  attacker: candidate.variant,
  fastMove: candidate.fastMove,
  chargedMove: candidate.chargedMove,
});

const trainer = (
  id: string,
  candidates: RaidCounterScore[],
): RaidPartyTrainer => ({
  id,
  label: id,
  team: candidates.map(member),
  settings,
  actionDelaySeconds: 0,
});

const simulationResult = (
  trainers: RaidPartyTrainer[],
  dps: number,
): RaidPartySimulationResult => {
  const projectedTimeToWinSeconds = 10_000 / dps;
  return {
    damageDealt: 10_000,
    elapsedSeconds: projectedTimeToWinSeconds,
    dps,
    projectedTimeToWinSeconds,
    faints: 6,
    relobbies: 0,
    attackerChargedMoves: 20,
    bossChargedMoves: 5,
    dodges: 0,
    partyPoweredChargedMoves: 4,
    won: true,
    distribution: {
      sampleCount: 1,
      winRate: 1,
      timeToWinSeconds: {
        p10: projectedTimeToWinSeconds,
        p50: projectedTimeToWinSeconds,
        p90: projectedTimeToWinSeconds,
      },
      faints: { p10: 6, p50: 6, p90: 6 },
      relobbies: { p10: 0, p50: 0, p90: 0 },
    },
    trainers: trainers.map((entry) => ({
      id: entry.id,
      label: entry.label,
      damageDealt: 5_000,
      damageShare: 0.5,
      dps: dps / trainers.length,
      faints: 3,
      relobbies: 0,
      dodges: 0,
      attackerChargedMoves: 10,
      partyPoweredChargedMoves: 2,
    })),
  };
};

describe("raid party optimizer", () => {
  const scores = [
    score("mega-alpha", 40, "mega"),
    score("mega-beta", 39, "mega"),
    ...Array.from({ length: 7 }, (_, index) =>
      score(`regular-${index + 1}`, 35 - index),
    ),
  ];

  it("builds varied legal teams without stacking multiple Mega slots", () => {
    const current = [scores[0], ...scores.slice(2, 7)].map(member);
    const candidates = buildRaidPartyTeamCandidates(current, scores);

    expect(candidates.length).toBeGreaterThan(2);
    candidates.forEach((team) => {
      expect(team).toHaveLength(6);
      expect(
        team.filter(({ attacker }) => attacker.variantType === "mega"),
      ).toHaveLength(1);
      expect(
        new Set(team.map(({ attacker }) => attacker.variant_id)).size,
      ).toBe(team.length);
    });
  });

  it("coordinates Trainer choices against whole-lobby outcomes", () => {
    const startingTeam = [scores[0], ...scores.slice(2, 7)];
    const trainers = [
      trainer("trainer-1", startingTeam),
      trainer("trainer-2", startingTeam),
    ];
    const evaluate = ({
      trainers: lineup,
    }: {
      trainers: RaidPartyTrainer[];
    }) => {
      const betaLeads = lineup.filter(
        (entry) => entry.team[0].attacker.variant_id === "mega-beta",
      ).length;
      return simulationResult(
        lineup,
        betaLeads === 2 ? 200 : betaLeads === 1 ? 90 : 100,
      );
    };

    const optimized = optimizeRaidParty(
      {
        trainers,
        scores,
        boss: { variant_id: "boss", name: "Boss" } as PokemonVariant,
        tier: { key: "legendary" } as RaidTierPreset,
      },
      evaluate,
    );

    expect(optimized).not.toBeNull();
    expect(optimized?.changedTrainerCount).toBe(2);
    expect(optimized?.result.dps).toBe(200);
    expect(optimized?.timeSavedSeconds).toBe(50);
    expect(optimized?.searchStrategy).toBe("bounded-beam");
    expect(optimized?.beamWidth).toBeGreaterThanOrEqual(2);
    expect(optimized?.trainerChanges).toHaveLength(2);
    expect(
      optimized?.trainerChanges.every((change) => change.reasons.length > 0),
    ).toBe(true);
    expect(optimized?.evaluatedLineups).toBeLessThanOrEqual(160);
  });

  it("keeps a full 20-Trainer search within the browser evaluation ceiling", () => {
    let evaluations = 0;
    const startingTeam = [scores[0], ...scores.slice(2, 7)];
    const trainers = Array.from({ length: 20 }, (_, index) =>
      trainer(`trainer-${index + 1}`, startingTeam),
    );
    const evaluate = ({
      trainers: lineup,
    }: {
      trainers: RaidPartyTrainer[];
    }) => {
      evaluations += 1;
      const betaLeads = lineup.filter(
        (entry) => entry.team[0].attacker.variant_id === "mega-beta",
      ).length;
      return simulationResult(lineup, 100 + betaLeads);
    };

    const optimized = optimizeRaidParty(
      {
        trainers,
        scores,
        boss: { variant_id: "boss", name: "Boss" } as PokemonVariant,
        tier: { key: "legendary" } as RaidTierPreset,
      },
      evaluate,
    );

    expect(optimized).not.toBeNull();
    expect(evaluations).toBe(optimized?.evaluatedLineups);
    expect(evaluations).toBeLessThanOrEqual(160);
  });
});

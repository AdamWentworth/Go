import { describe, expect, it } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import {
  simulateHeterogeneousRaidPartyBattle,
  type RaidCounterSettings,
  type RaidPartyTrainer,
  type RaidTierPreset,
} from "@/pages/Raid/utils/raidCalculations";

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
  }) as unknown as Move;

const pokemon = (
  name: string,
  attack: number,
  defense: number,
  stamina: number,
  moves: Move[],
  variantType = "default",
): PokemonVariant =>
  ({
    pokemon_id: name.length,
    pokedex_number: name.length,
    name,
    species_name: name,
    variant_id: `${name.toLowerCase().replaceAll(" ", "-")}-${variantType}`,
    variantType,
    attack,
    defense,
    stamina,
    type1_name: "normal",
    type2_name: "none",
    moves,
    currentImage: "",
    image_url: "",
    sprite_url: "",
    backgrounds: [],
    raid_boss: [],
  }) as unknown as PokemonVariant;

const fast = move("Quick Hit", "normal", true, 10, 500, 10);
const charged = move("Heavy Hit", "normal", false, 90, 1500, -50);
const bossFast = move("Boss Tap", "normal", true, 8, 1000, 20);
const bossCharged = move("Boss Burst", "normal", false, 140, 1500, -50);
const strong = pokemon("Strong", 300, 190, 220, [fast, charged]);
const steady = pokemon("Steady", 225, 190, 220, [fast, charged]);
const boss = pokemon("Boss", 250, 200, 250, [bossFast, bossCharged]);

const tier: RaidTierPreset = {
  key: "tier3",
  label: "Test raid",
  shortLabel: "Test",
  bossHp: 5000,
  bossStatMultiplier: 0.73,
  timeLimitSeconds: 180,
  note: "Test",
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
  dodgeSuccessRate: 1,
};

const trainer = (
  id: string,
  attacker: PokemonVariant,
  overrides: Partial<RaidPartyTrainer> = {},
): RaidPartyTrainer => ({
  id,
  label: id,
  team: Array.from({ length: 6 }, () => ({
    attacker,
    fastMove: fast,
    chargedMove: charged,
  })),
  settings,
  actionDelaySeconds: 0,
  ...overrides,
});

describe("heterogeneous raid party simulation", () => {
  it("rejects lobbies beyond the supported Trainer cap", () => {
    expect(() =>
      simulateHeterogeneousRaidPartyBattle({
        trainers: Array.from({ length: 21 }, (_, index) =>
          trainer(`trainer-${index}`, steady),
        ),
        boss,
        bossFastMove: bossFast,
        bossChargedMove: bossCharged,
        tier,
      }),
    ).toThrow("up to 20 Trainers");
  });

  it("runs independent Trainer timelines against one shared boss", () => {
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("strong", strong), trainer("steady", steady)],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier,
    });

    expect(result.trainers).toHaveLength(2);
    expect(result.trainers.every((entry) => entry.damageDealt > 0)).toBe(true);
    expect(result.trainers[0].damageDealt).toBeGreaterThan(
      result.trainers[1].damageDealt,
    );
    expect(
      result.trainers.reduce((sum, entry) => sum + entry.damageShare, 0),
    ).toBeCloseTo(1, 6);
    expect(result.damageDealt).toBeCloseTo(
      result.trainers.reduce((sum, entry) => sum + entry.damageDealt, 0),
      6,
    );
  });

  it("reduces only the delayed Trainer's contribution", () => {
    const baseline = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("first", strong), trainer("second", strong)],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier,
    });
    const delayed = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        trainer("first", strong),
        trainer("second", strong, { actionDelaySeconds: 1 }),
      ],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier,
    });

    expect(delayed.trainers[1].damageShare).toBeLessThan(
      baseline.trainers[1].damageShare,
    );
    expect(delayed.trainers[0].damageShare).toBeGreaterThan(
      baseline.trainers[0].damageShare,
    );
  });

  it("tracks dodge outcomes independently per Trainer", () => {
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        trainer("dodger", steady, {
          settings: {
            ...settings,
            dodgeStrategy: "charged",
            dodgeSuccessRate: 1,
          },
        }),
        trainer("missed", steady, {
          settings: {
            ...settings,
            dodgeStrategy: "charged",
            dodgeSuccessRate: 0,
          },
        }),
      ],
      boss: { ...boss, attack: 500 },
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: { ...tier, bossHp: 9000 },
      shouldBossUseCharged: () => true,
      shouldDodgeSucceed: (trainerIndex) => trainerIndex === 0,
    });

    expect(result.trainers[0].dodges).toBeGreaterThan(0);
    expect(result.trainers[1].dodges).toBe(0);
    expect(result.trainers[0].faints).toBeLessThanOrEqual(
      result.trainers[1].faints,
    );
  });

  it("applies an active Mega ally boost to teammates instead of itself", () => {
    const megaSupport = pokemon(
      "Mega Support",
      180,
      220,
      260,
      [fast, charged],
      "mega",
    );
    const regularSupport = { ...megaSupport, variantType: "default" as const };
    const withMega = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("attacker", strong), trainer("support", megaSupport)],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier,
    });
    const withoutMega = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        trainer("attacker", strong),
        trainer("support", regularSupport),
      ],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier,
    });

    expect(withMega.trainers[0].dps).toBeGreaterThan(
      withoutMega.trainers[0].dps,
    );
  });
});

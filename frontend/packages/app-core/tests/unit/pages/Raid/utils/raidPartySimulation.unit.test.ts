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

  it("applies each Trainer's Party Power timing policy independently", () => {
    const partySettings: RaidCounterSettings = {
      ...settings,
      partyPower: "party4",
      partyPowerStrategy: "immediate",
    };
    const immediate = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        trainer("first", steady, { settings: partySettings }),
        trainer("second", steady, { settings: partySettings }),
      ],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: { ...tier, bossHp: 12_000, timeLimitSeconds: 60 },
    });
    const manual = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        trainer("first", steady, {
          settings: { ...partySettings, partyPowerStrategy: "manual" },
        }),
        trainer("second", steady, {
          settings: { ...partySettings, partyPowerStrategy: "manual" },
        }),
      ],
      boss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: { ...tier, bossHp: 12_000, timeLimitSeconds: 60 },
    });

    expect(immediate.partyPoweredChargedMoves).toBeGreaterThan(0);
    expect(manual.partyPoweredChargedMoves).toBe(0);
    expect(immediate.damageDealt).toBeGreaterThan(manual.damageDealt);
  });

  it("breaks one Super Mega shield per Trainer with an actual Mega charged attack", () => {
    const mega = pokemon(
      "Mega Attacker",
      300,
      190,
      220,
      [fast, charged],
      "mega",
    );
    const superMegaBoss = {
      ...boss,
      variantType: "mega_test" as const,
      megaForm: "Test",
      raid_boss: [
        {
          id: 1,
          pokemon_id: boss.pokemon_id,
          name: "Mega Boss",
          form: "Test",
          tier: "super_mega",
          shield_count: 2,
        },
      ],
    } as unknown as PokemonVariant;
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("first", mega), trainer("second", mega)],
      boss: superMegaBoss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: {
        ...tier,
        key: "super-mega",
        bossHp: 2_000,
      },
    });

    expect(result.superMega).toMatchObject({
      shieldCount: 2,
      shieldsBroken: 2,
      eligibleMegaTrainers: 2,
      shieldCleared: true,
    });
  });

  it("clears a full ten-shield Super Mega raid when ten Mega-ready Trainers have enough damage", () => {
    const mega = pokemon(
      "Mega Attacker",
      400,
      220,
      240,
      [fast, charged],
      "mega",
    );
    const superMegaBoss = {
      ...boss,
      variantType: "mega_test" as const,
      megaForm: "Test",
      raid_boss: [
        {
          id: 1,
          pokemon_id: boss.pokemon_id,
          name: "Mega Boss",
          form: "Test",
          tier: "super_mega",
          shield_count: 10,
        },
      ],
    } as unknown as PokemonVariant;
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: Array.from({ length: 10 }, (_, index) =>
        trainer(`trainer-${index + 1}`, mega),
      ),
      boss: superMegaBoss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: {
        ...tier,
        key: "super-mega",
        bossHp: 25_000,
        timeLimitSeconds: 300,
      },
    });

    expect(result.won).toBe(true);
    expect(result.projectedTimeToWinSeconds).toBeLessThan(300);
    expect(result.superMega).toMatchObject({
      shieldCount: 10,
      shieldsBroken: 10,
      eligibleMegaTrainers: 10,
      shieldCleared: true,
    });
  });

  it("automatically deploys a Mega from the final slot with a charged attack ready", () => {
    const regular = pokemon(
      "Regular Lead",
      280,
      190,
      220,
      [fast, charged],
    );
    const mega = pokemon(
      "Mega Finisher",
      320,
      200,
      230,
      [fast, charged],
      "mega",
    );
    const finalSlotMegaTrainer: RaidPartyTrainer = {
      ...trainer("final-slot-mega", regular),
      team: [
        ...Array.from({ length: 5 }, () => ({
          attacker: regular,
          fastMove: fast,
          chargedMove: charged,
        })),
        { attacker: mega, fastMove: fast, chargedMove: charged },
      ],
    };
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [finalSlotMegaTrainer],
      boss: {
        ...boss,
        variantType: "mega_test" as const,
        megaForm: "Test",
        raid_boss: [
          {
            id: 1,
            pokemon_id: boss.pokemon_id,
            name: "Mega Boss",
            form: "Test",
            tier: "super_mega",
            shield_count: 1,
          },
        ],
      } as unknown as PokemonVariant,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: { ...tier, key: "super-mega", bossHp: 1_500 },
    });

    expect(result.superMega).toMatchObject({
      shieldsBroken: 1,
      eligibleMegaTrainers: 1,
      shieldCleared: true,
    });
  });

  it("allows each Trainer to break only one shield even with six Megas", () => {
    const mega = pokemon(
      "Mega Team",
      350,
      210,
      230,
      [fast, charged],
      "mega",
    );
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("one-trainer", mega)],
      boss: {
        ...boss,
        variantType: "mega_test" as const,
        megaForm: "Test",
        raid_boss: [
          {
            id: 1,
            pokemon_id: boss.pokemon_id,
            name: "Mega Boss",
            form: "Test",
            tier: "super_mega",
            shield_count: 2,
          },
        ],
      } as unknown as PokemonVariant,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: { ...tier, key: "super-mega", bossHp: 2_000 },
    });

    expect(result.superMega).toMatchObject({
      shieldsBroken: 1,
      eligibleMegaTrainers: 1,
      shieldCleared: false,
    });
  });

  it("leaves one shield active when only nine of ten Trainers bring a Mega", () => {
    const mega = pokemon(
      "Mega Attacker",
      400,
      220,
      240,
      [fast, charged],
      "mega",
    );
    const regular = pokemon(
      "Regular Attacker",
      400,
      220,
      240,
      [fast, charged],
    );
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [
        ...Array.from({ length: 9 }, (_, index) =>
          trainer(`mega-${index + 1}`, mega),
        ),
        trainer("no-mega", regular),
      ],
      boss: {
        ...boss,
        variantType: "mega_test" as const,
        megaForm: "Test",
        raid_boss: [
          {
            id: 1,
            pokemon_id: boss.pokemon_id,
            name: "Mega Boss",
            form: "Test",
            tier: "super_mega",
            shield_count: 10,
          },
        ],
      } as unknown as PokemonVariant,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: {
        ...tier,
        key: "super-mega",
        bossHp: 25_000,
        timeLimitSeconds: 300,
      },
    });

    expect(result.superMega).toMatchObject({
      shieldsBroken: 9,
      eligibleMegaTrainers: 9,
      shieldCleared: false,
    });
  });

  it("can still time out after clearing every shield when lobby damage is inadequate", () => {
    const lowDamageFast = move("Soft Tap", "normal", true, 1, 3000, 1);
    const lowDamageCharged = move(
      "Soft Burst",
      "normal",
      false,
      1,
      3000,
      -100,
    );
    const weakMega = pokemon(
      "Weak Mega",
      20,
      220,
      240,
      [lowDamageFast, lowDamageCharged],
      "mega",
    );
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: Array.from({ length: 10 }, (_, index) =>
        ({
          ...trainer(`weak-${index + 1}`, weakMega),
          team: Array.from({ length: 6 }, () => ({
            attacker: weakMega,
            fastMove: lowDamageFast,
            chargedMove: lowDamageCharged,
          })),
        }),
      ),
      boss: {
        ...boss,
        variantType: "mega_test" as const,
        megaForm: "Test",
        raid_boss: [
          {
            id: 1,
            pokemon_id: boss.pokemon_id,
            name: "Mega Boss",
            form: "Test",
            tier: "super_mega",
            shield_count: 10,
          },
        ],
      } as unknown as PokemonVariant,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: {
        ...tier,
        key: "super-mega",
        bossHp: 100,
        timeLimitSeconds: 30,
      },
    });

    expect(result.superMega).toMatchObject({
      shieldsBroken: 10,
      shieldCleared: true,
    });
    expect(result.won).toBe(false);
  });

  it("does not count Primal Pokémon as Super Mega shield breakers", () => {
    const primal = {
      ...pokemon("Primal Support", 300, 190, 220, [fast, charged], "primal"),
      primal: true,
    } as unknown as PokemonVariant;
    const superMegaBoss = {
      ...boss,
      variantType: "mega_test" as const,
      megaForm: "Test",
      raid_boss: [
        {
          id: 1,
          pokemon_id: boss.pokemon_id,
          name: "Mega Boss",
          form: "Test",
          tier: "super_mega",
          shield_count: 2,
        },
      ],
    } as unknown as PokemonVariant;
    const result = simulateHeterogeneousRaidPartyBattle({
      trainers: [trainer("first", primal), trainer("second", primal)],
      boss: superMegaBoss,
      bossFastMove: bossFast,
      bossChargedMove: bossCharged,
      tier: {
        ...tier,
        key: "super-mega",
        bossHp: 2_000,
      },
    });

    expect(result.superMega).toMatchObject({
      shieldsBroken: 0,
      eligibleMegaTrainers: 0,
      shieldCleared: false,
    });
  });
});

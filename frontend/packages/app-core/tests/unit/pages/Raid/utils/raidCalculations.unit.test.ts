import { describe, expect, it } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import {
  getRaidOverallTargetProfiles,
  getRaidTypeTargetProfiles,
} from "@/pages/Raid/utils/raidCatalog";
import { calculateRaidIncomingPressure } from "@/pages/Raid/utils/raidCombat";
import {
  RAID_TIER_PRESETS,
  calculateEffectiveRaidDps,
  calculateRaidBossCp,
  calculateRaidMoveDamage,
  calculateTypeMoveCycleScore,
  dedupeBestOverallAttackerPerVariant,
  dedupeBestTypeDpsPerVariant,
  estimateRaidGroup,
  isEligibleRaidAttacker,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidBoss,
  isMaxBattleVariant,
  scoreBestRaidOverallAttackers,
  scoreRaidCounters,
  scoreRaidOverallAttackers,
  scoreRaidTypeDps,
  type RaidCounterSettings,
  type RaidOverallScore,
  type RaidTypeDpsScore,
} from "@/pages/Raid/utils/raidCalculations";

type RaidCalculationVariantOverrides = Omit<
  Partial<PokemonVariant>,
  "moves" | "raid_boss"
> & {
  moves?: Move[];
  raid_boss?: unknown[];
};

const move = (
  name: string,
  type: string,
  isFast: 0 | 1,
  power: number,
  cooldown: number,
  energy: number,
  overrides: Partial<Move> = {},
) =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast,
    raid_power: power,
    raid_cooldown: cooldown,
    raid_energy: energy,
    fusion_id: null,
    ...overrides,
  }) as unknown as Move;

const pokemon = (
  overrides: RaidCalculationVariantOverrides = {},
): PokemonVariant =>
  ({
    pokemon_id: overrides.pokemon_id ?? 150,
    pokedex_number: overrides.pokedex_number ?? 150,
    name: overrides.name ?? "Mewtwo",
    species_name: overrides.species_name ?? overrides.name ?? "Mewtwo",
    attack: overrides.attack ?? 300,
    defense: overrides.defense ?? 182,
    stamina: overrides.stamina ?? 214,
    type_1_id: overrides.type_1_id ?? 15,
    type_2_id: overrides.type_2_id ?? 0,
    type1_name: overrides.type1_name ?? "psychic",
    type2_name: overrides.type2_name ?? "none",
    variantType: overrides.variantType ?? "default",
    fusion_id: overrides.fusion_id ?? null,
    currentImage: overrides.currentImage ?? "",
    image_url: overrides.image_url ?? "",
    sprite_url: overrides.sprite_url ?? "",
    moves: overrides.moves ?? [
      move("Confusion", "psychic", 1, 20, 1600, 15),
      move("Psystrike", "psychic", 0, 95, 2300, -50),
    ],
    raid_boss: (overrides.raid_boss ??
      []) as unknown as PokemonVariant["raid_boss"],
    backgrounds: [],
    variant_id: overrides.variant_id ?? `${overrides.name ?? "mewtwo"}-default`,
  }) as unknown as PokemonVariant;

const legendaryRaidTarget = (
  overrides: RaidCalculationVariantOverrides = {},
): PokemonVariant =>
  pokemon({
    ...overrides,
    raid_boss: overrides.raid_boss ?? [
      {
        id: overrides.pokemon_id ?? 1,
        tier: "5",
        form: "Normal",
        name: overrides.name ?? "Raid Target",
      },
    ],
  });

const baseSettings: RaidCounterSettings = {
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

describe("raid calculations", () => {
  it("keeps current raid tier durability presets in place", () => {
    expect(RAID_TIER_PRESETS.tier1.bossHp).toBe(600);
    expect(RAID_TIER_PRESETS.tier3.bossHp).toBe(3600);
    expect(RAID_TIER_PRESETS.legendary.bossHp).toBe(15000);
    expect(RAID_TIER_PRESETS.primal.bossHp).toBe(22500);
    expect(RAID_TIER_PRESETS["legendary-mega"].bossHp).toBe(22500);
    expect(RAID_TIER_PRESETS["super-mega"].bossHp).toBe(25000);
  });

  it("calculates raid boss CP from base stats and raid HP", () => {
    expect(
      calculateRaidBossCp(pokemon(), RAID_TIER_PRESETS.legendary.bossHp),
    ).toBe(54148);
  });

  it("selects one raid category per variant and separates normal from mega rows", () => {
    const raidBossRows = [
      { id: 1, tier: "3", form: "Normal", name: "Venusaur" },
      { id: 2, tier: "4", form: "Normal", name: "Venusaur" },
      { id: 3, tier: "mega", form: "Normal", name: "Venusaur" },
      { id: 4, tier: "2", form: "Normal", name: "Venusaur" },
    ];
    const venusaur = pokemon({
      name: "Venusaur",
      variant_id: "venusaur-default",
      pokemon_id: 3,
      pokedex_number: 3,
      raid_boss: raidBossRows,
    });
    const megaVenusaur = pokemon({
      name: "Mega Venusaur",
      variant_id: "venusaur-mega",
      pokemon_id: 3,
      pokedex_number: 3,
      variantType: "mega",
      raid_boss: raidBossRows,
    });
    const shadowVenusaur = pokemon({
      name: "Shadow Venusaur",
      variant_id: "venusaur-shadow",
      pokemon_id: 3,
      pokedex_number: 3,
      variantType: "shadow",
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(venusaur)).toBe("tier3");
    expect(getPrimaryRaidMetadataForVariant(venusaur)?.tier).toBe("3");
    expect(getRaidTierKeyForVariant(megaVenusaur)).toBe("mega");
    expect(isEligibleRaidBoss(venusaur)).toBe(true);
    expect(isEligibleRaidBoss(megaVenusaur)).toBe(true);
    expect(isEligibleRaidBoss(shadowVenusaur)).toBe(false);
  });

  it("maps Super Mega raid metadata to the Super Mega raid preset", () => {
    const raidBossRows = [
      { id: 910999, tier: "super_mega", form: "Normal", name: "Skarmory" },
    ];
    const skarmory = pokemon({
      name: "Mega Skarmory",
      variant_id: "skarmory-super-mega",
      pokemon_id: 227,
      pokedex_number: 227,
      variantType: "mega",
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(skarmory)).toBe("super-mega");
    expect(getPrimaryRaidMetadataForVariant(skarmory)?.tier).toBe("super_mega");
  });

  it("maps costume raid metadata only to the matching non-shiny costume boss", () => {
    const raidBossRows = [
      {
        id: 920013,
        tier: "1",
        form: "Normal",
        name: "Holiday 2023 Pikachu",
        costume_id: 216,
      },
    ];
    const pikachu = pokemon({
      name: "Pikachu",
      variant_id: "pikachu-default",
      pokemon_id: 25,
      pokedex_number: 25,
      raid_boss: raidBossRows,
    });
    const holidayPikachu = pokemon({
      name: "Holiday 2023 Pikachu",
      variant_id: "pikachu-costume-216",
      pokemon_id: 25,
      pokedex_number: 25,
      variantType: "costume_216",
      raid_boss: raidBossRows,
    });
    const shinyHolidayPikachu = pokemon({
      name: "Shiny Holiday 2023 Pikachu",
      variant_id: "pikachu-costume-216-shiny",
      pokemon_id: 25,
      pokedex_number: 25,
      variantType: "costume_216_shiny",
      raid_boss: raidBossRows,
    });

    expect(getRaidTierKeyForVariant(pikachu)).toBeNull();
    expect(getRaidTierKeyForVariant(holidayPikachu)).toBe("tier1");
    expect(getPrimaryRaidMetadataForVariant(holidayPikachu)?.costume_id).toBe(
      216,
    );
    expect(isEligibleRaidBoss(holidayPikachu)).toBe(true);
    expect(isEligibleRaidAttacker(holidayPikachu)).toBe(false);
    expect(isEligibleRaidBoss(shinyHolidayPikachu)).toBe(false);
  });

  it("excludes Dynamax and Gigantamax copies from Gym raid rankings", () => {
    const raidBossRows = [
      { id: 376, tier: "3", form: "Normal", name: "Metagross" },
    ];
    const metagross = pokemon({
      name: "Metagross",
      variant_id: "metagross-default",
      pokemon_id: 376,
      pokedex_number: 376,
      raid_boss: raidBossRows,
    });
    const dynamaxMetagross = pokemon({
      ...metagross,
      name: "Dynamax Metagross",
      variant_id: "metagross-dynamax",
      variantType: "dynamax",
    });
    const gigantamaxMetagross = pokemon({
      ...metagross,
      name: "Gigantamax Metagross",
      variant_id: "metagross-gigantamax",
      variantType: "gigantamax",
    });

    expect(isMaxBattleVariant(metagross)).toBe(false);
    expect(isEligibleRaidAttacker(metagross)).toBe(true);
    expect(isEligibleRaidBoss(metagross)).toBe(true);

    for (const maxVariant of [dynamaxMetagross, gigantamaxMetagross]) {
      expect(isMaxBattleVariant(maxVariant)).toBe(true);
      expect(isEligibleRaidAttacker(maxVariant)).toBe(false);
      expect(isEligibleRaidBoss(maxVariant)).toBe(false);
    }
  });

  it("selects fusion and shadow raid categories only for matching variants", () => {
    const kyuremFusionRows = [
      { id: 900001, tier: "fusion_5", form: "Black", name: "Black Kyurem" },
      { id: 900002, tier: "fusion_5", form: "White", name: "White Kyurem" },
    ];
    const kyurem = pokemon({
      name: "Kyurem",
      species_name: "Kyurem",
      variant_id: "kyurem-default",
      pokemon_id: 646,
      pokedex_number: 646,
      raid_boss: kyuremFusionRows,
    });
    const blackKyurem = pokemon({
      name: "Black Kyurem",
      species_name: "Black Kyurem",
      variant_id: "kyurem-fusion-black",
      pokemon_id: 646,
      pokedex_number: 646,
      variantType: "fusion_4",
      raid_boss: kyuremFusionRows,
    });
    const palkiaShadowRow = [
      { id: 900011, tier: "shadow_5", form: "Normal", name: "Shadow Palkia" },
    ];
    const palkia = pokemon({
      name: "Palkia",
      variant_id: "palkia-default",
      pokemon_id: 484,
      pokedex_number: 484,
      raid_boss: palkiaShadowRow,
    });
    const shadowPalkia = pokemon({
      name: "Shadow Palkia",
      variant_id: "palkia-shadow",
      pokemon_id: 484,
      pokedex_number: 484,
      variantType: "shadow",
      raid_boss: palkiaShadowRow,
    });

    expect(isEligibleRaidBoss(kyurem)).toBe(false);
    expect(getRaidTierKeyForVariant(blackKyurem)).toBe("legendary");
    expect(getPrimaryRaidMetadataForVariant(blackKyurem)?.name).toBe(
      "Black Kyurem",
    );
    expect(isEligibleRaidBoss(palkia)).toBe(false);
    expect(getRaidTierKeyForVariant(shadowPalkia)).toBe("shadow-legendary");
    expect(isEligibleRaidBoss(shadowPalkia)).toBe(true);
  });

  it("applies effectiveness, STAB, shadow attacker bonus, and the raid damage +1 floor", () => {
    const boss = pokemon();
    const tyranitar = pokemon({
      name: "Tyranitar",
      variant_id: "tyranitar-default",
      attack: 251,
      defense: 207,
      stamina: 225,
      type1_name: "rock",
      type2_name: "dark",
      variantType: "default",
    });
    const shadowTyranitar = pokemon({
      ...tyranitar,
      name: "Shadow Tyranitar",
      variant_id: "tyranitar-shadow",
      variantType: "shadow",
    });
    const darkMove = move("Bite", "dark", 1, 6, 500, 4);
    const neutralMove = move("Tackle", "normal", 1, 5, 500, 4);

    const neutralDamage = calculateRaidMoveDamage({
      move: neutralMove,
      attacker: tyranitar,
      attackerAttack: tyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ["psychic"],
      settings: baseSettings,
      charged: false,
    });
    const superEffectiveDamage = calculateRaidMoveDamage({
      move: darkMove,
      attacker: tyranitar,
      attackerAttack: tyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ["psychic"],
      settings: baseSettings,
      charged: false,
    });
    const shadowDamage = calculateRaidMoveDamage({
      move: darkMove,
      attacker: shadowTyranitar,
      attackerAttack: shadowTyranitar.attack,
      bossDefense: boss.defense,
      bossTypes: ["psychic"],
      settings: baseSettings,
      charged: false,
    });

    expect(neutralDamage).toBeGreaterThanOrEqual(1);
    expect(superEffectiveDamage).toBeGreaterThan(neutralDamage);
    expect(shadowDamage).toBeGreaterThan(superEffectiveDamage);
  });

  it("applies incoming raid damage floors before averaging boss movesets", () => {
    const scenarios = [
      {
        fastDamageCoefficient: 199.9,
        chargedDamageCoefficient: 399.9,
        fastUsesPerChargedMove: 1,
        cycleSeconds: 2,
      },
    ];

    expect(calculateRaidIncomingPressure(scenarios, 100)).toEqual({
      incomingDps: 3,
      incomingChargedDamage: 4,
    });
    expect(calculateRaidIncomingPressure(scenarios, 99)).toEqual({
      incomingDps: 4,
      incomingChargedDamage: 5,
    });
  });

  it("exposes favorable, expected, and hostile boss moveset pressure", () => {
    const scenarios = [
      {
        fastDamageCoefficient: 100,
        chargedDamageCoefficient: 300,
        fastUsesPerChargedMove: 1,
        cycleSeconds: 2,
      },
      {
        fastDamageCoefficient: 300,
        chargedDamageCoefficient: 700,
        fastUsesPerChargedMove: 1,
        cycleSeconds: 2,
      },
    ];

    const favorable = calculateRaidIncomingPressure(
      scenarios,
      100,
      "favorable",
    );
    const expected = calculateRaidIncomingPressure(
      scenarios,
      100,
      "expected",
    );
    const hostile = calculateRaidIncomingPressure(scenarios, 100, "hostile");

    expect(favorable?.incomingDps).toBeLessThan(expected?.incomingDps ?? 0);
    expect(expected?.incomingDps).toBeLessThan(hostile?.incomingDps ?? 0);
    expect(favorable?.incomingChargedDamage).toBe(4);
    expect(hostile?.incomingChargedDamage).toBe(8);
  });

  it("models Party Power as a charged-move damage boost", () => {
    const boss = pokemon();
    const attacker = pokemon({
      name: "Gengar",
      variant_id: "gengar-default",
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: "ghost",
      type2_name: "poison",
    });
    const chargedMove = move("Shadow Ball", "ghost", 0, 100, 3000, -50);

    const withoutPartyPower = calculateRaidMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack: attacker.attack,
      bossDefense: boss.defense,
      bossTypes: ["psychic"],
      settings: baseSettings,
      charged: true,
    });
    const withEveryChargeBoosted = calculateRaidMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack: attacker.attack,
      bossDefense: boss.defense,
      bossTypes: ["psychic"],
      settings: { ...baseSettings, partyPower: "every" },
      charged: true,
    });

    expect(withEveryChargeBoosted).toBeGreaterThan(withoutPartyPower);
  });

  it("estimates the group size from the best six scored counters", () => {
    const boss = pokemon();
    const counters = [
      pokemon({
        name: "Tyranitar",
        variant_id: "tyranitar-default",
        attack: 251,
        defense: 207,
        stamina: 225,
        type1_name: "rock",
        type2_name: "dark",
        moves: [
          move("Bite", "dark", 1, 6, 500, 4),
          move("Brutal Swing", "dark", 0, 65, 1900, -33),
        ],
      }),
      pokemon({
        name: "Gengar",
        variant_id: "gengar-default",
        attack: 261,
        defense: 149,
        stamina: 155,
        type1_name: "ghost",
        type2_name: "poison",
        moves: [
          move("Lick", "ghost", 1, 5, 500, 6),
          move("Shadow Ball", "ghost", 0, 100, 3000, -50),
        ],
      }),
    ];

    const scores = scoreRaidCounters(
      counters,
      boss,
      RAID_TIER_PRESETS.legendary,
      baseSettings,
    );
    const estimate = estimateRaidGroup(
      scores,
      boss,
      RAID_TIER_PRESETS.legendary,
      "normal",
    );

    expect(scores.length).toBeGreaterThan(0);
    expect(estimate.topTeamDps).toBeGreaterThan(0);
    expect(estimate.minTrainers).toBeGreaterThan(0);
    expect(estimate.comfortableTrainers).toBeGreaterThanOrEqual(
      estimate.minTrainers,
    );
  });

  it("models effective DPS across a team of six and its relobby downtime", () => {
    const noDelay = calculateEffectiveRaidDps({
      dps: 30,
      tdo: 300,
      relobbySeconds: 0,
    });
    const tenSecondDelay = calculateEffectiveRaidDps({
      dps: 30,
      tdo: 300,
      relobbySeconds: 10,
    });
    const oneAttackerCycle = calculateEffectiveRaidDps({
      dps: 30,
      tdo: 300,
      relobbySeconds: 10,
      teamSize: 1,
    });

    expect(noDelay).toBe(30);
    expect(tenSecondDelay).toBeCloseTo(30 * (60 / 70), 6);
    expect(oneAttackerCycle).toBe(15);
    expect(tenSecondDelay).toBeLessThan(noDelay);
  });

  it("ranks overall attackers by effective team DPS without needing a boss matchup", () => {
    const gengar = pokemon({
      name: "Gengar",
      variant_id: "gengar-default",
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: "ghost",
      type2_name: "poison",
      moves: [
        move("Lick", "ghost", 1, 5, 500, 6),
        move("Shadow Ball", "ghost", 0, 100, 3000, -50),
      ],
    });
    const blissey = pokemon({
      name: "Blissey",
      variant_id: "blissey-default",
      attack: 129,
      defense: 169,
      stamina: 496,
      type1_name: "normal",
      type2_name: "none",
      moves: [
        move("Pound", "normal", 1, 7, 600, 6),
        move("Hyper Beam", "normal", 0, 150, 3800, -100),
      ],
    });
    const shinyGengar = pokemon({
      name: "Shiny Gengar",
      variant_id: "gengar-shiny",
      variantType: "shiny",
      moves: [
        move("Lick", "ghost", 1, 5, 500, 6),
        move("Shadow Ball", "ghost", 0, 100, 3000, -50),
      ],
    });

    const scores = scoreRaidOverallAttackers(
      [gengar, blissey, shinyGengar],
      baseSettings,
    );
    const scoreNames = scores.map((score) => score.variant.name);
    const gengarScore = scores.find((score) => score.variant.name === "Gengar");

    expect(scoreNames).toContain("Gengar");
    expect(scoreNames).toContain("Blissey");
    expect(scoreNames).not.toContain("Shiny Gengar");
    expect(gengarScore?.dps).toBeGreaterThan(0);
    expect(gengarScore?.tdo).toBeGreaterThan(0);
    expect(gengarScore?.er).toBeGreaterThan(0);
    expect(gengarScore?.eDps).toBeGreaterThan(0);
    expect(gengarScore?.eDps).toBeLessThan(gengarScore?.dps ?? 0);
    expect(scores[0]?.eDps).toBeGreaterThanOrEqual(scores[1]?.eDps ?? 0);
  });

  it("changes only effective DPS when the relobby delay changes", () => {
    const attacker = pokemon({
      name: "Raider",
      variant_id: "raider-default",
      attack: 220,
      defense: 190,
      stamina: 190,
      type1_name: "electric",
      type2_name: "none",
      moves: [
        move("Thunder Shock", "electric", 1, 5, 600, 8),
        move("Wild Charge", "electric", 0, 90, 2600, -50),
      ],
    });
    const noDelay = scoreRaidOverallAttackers([attacker], {
      ...baseSettings,
      relobbySeconds: 0,
    })[0] as RaidOverallScore;
    const longDelay = scoreRaidOverallAttackers([attacker], {
      ...baseSettings,
      relobbySeconds: 20,
    })[0] as RaidOverallScore;

    expect(noDelay.eDps).toBeCloseTo(noDelay.dps, 6);
    expect(longDelay.eDps).toBeLessThan(noDelay.eDps);
    expect(longDelay.dps).toBeCloseTo(noDelay.dps, 6);
    expect(longDelay.tdo).toBeCloseTo(noDelay.tdo, 6);
    expect(longDelay.er).toBeCloseTo(noDelay.er, 6);
  });

  it("uses each real raid target's defense in type rankings", () => {
    const attacker = pokemon({
      name: "Machamp",
      variant_id: "machamp-default",
      attack: 234,
      defense: 159,
      stamina: 207,
      type1_name: "fighting",
      type2_name: "none",
      moves: [
        move("Counter", "fighting", 1, 13, 1000, 9),
        move("Dynamic Punch", "fighting", 0, 90, 2700, -50),
      ],
    });
    const raidBoss = (name: string, defense: number) =>
      pokemon({
        name,
        variant_id: `${name.toLowerCase()}-raid-target`,
        attack: 220,
        defense,
        stamina: 220,
        type1_name: "rock",
        type2_name: "none",
        moves: [
          move("Rock Throw", "rock", 1, 12, 900, 7),
          move("Stone Edge", "rock", 0, 105, 2300, -100),
        ],
        raid_boss: [{ id: defense, tier: "5", form: "Normal", name }],
      });
    const lowerDefenseBoss = raidBoss("Lower Defense Boss", 100);
    const higherDefenseBoss = raidBoss("Higher Defense Boss", 300);

    const lowerType = scoreRaidTypeDps(
      [attacker],
      "fighting",
      baseSettings,
      [lowerDefenseBoss],
    )[0] as RaidTypeDpsScore;
    const higherType = scoreRaidTypeDps(
      [attacker],
      "fighting",
      baseSettings,
      [higherDefenseBoss],
    )[0] as RaidTypeDpsScore;

    expect(lowerType.dps).toBeGreaterThan(higherType.dps);
    expect(lowerType.chargedDamage).toBeGreaterThan(
      higherType.chargedDamage,
    );
  });

  it("keeps same-typing raid targets independent for exact type scoring", () => {
    const targets = [
      pokemon({
        name: "First Rock Boss",
        variant_id: "first-rock-boss",
        type1_name: "rock",
        type2_name: "none",
        raid_boss: [
          { id: 1, tier: "5", form: "Normal", name: "First Rock Boss" },
        ],
      }),
      pokemon({
        name: "Second Rock Boss",
        variant_id: "second-rock-boss",
        type1_name: "rock",
        type2_name: "none",
        raid_boss: [
          { id: 2, tier: "5", form: "Normal", name: "Second Rock Boss" },
        ],
      }),
    ];

    const profiles = getRaidTypeTargetProfiles("fighting", targets);

    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.weight)).toEqual([1, 1]);
    expect(profiles.map((profile) => profile.target?.name)).toEqual([
      "First Rock Boss",
      "Second Rock Boss",
    ]);
  });

  it("uses only high-tier bosses in type investment rankings", () => {
    const tierOneBoss = pokemon({
      name: "Tier One Boss",
      variant_id: "tier-one-boss",
      type1_name: "rock",
      type2_name: "none",
      raid_boss: [
        { id: 1, tier: "1", form: "Normal", name: "Tier One Boss" },
      ],
    });
    const legendaryBoss = legendaryRaidTarget({
      name: "Legendary Boss",
      variant_id: "legendary-boss",
      type1_name: "rock",
      type2_name: "none",
    });

    const profiles = getRaidTypeTargetProfiles("fighting", [
      tierOneBoss,
      legendaryBoss,
    ]);

    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.target?.name).toBe("Legendary Boss");
    expect(profiles[0]?.weight).toBe(1);
  });

  it("models Normal rankings against real high-tier neutral targets", () => {
    const neutralBoss = legendaryRaidTarget({
      name: "Neutral Psychic Boss",
      variant_id: "neutral-psychic-boss",
      type1_name: "psychic",
      type2_name: "none",
    });
    const resistantBoss = legendaryRaidTarget({
      name: "Resistant Steel Boss",
      variant_id: "resistant-steel-boss",
      type1_name: "steel",
      type2_name: "none",
    });

    const profiles = getRaidTypeTargetProfiles("normal", [
      neutralBoss,
      resistantBoss,
    ]);

    expect(profiles.map((profile) => profile.target?.name)).toEqual([
      "Neutral Psychic Boss",
    ]);
  });

  it("uses legal boss moves and typing to model type-ranking survival", () => {
    const attacker = pokemon({
      name: "Venusaur",
      variant_id: "venusaur-default",
      attack: 198,
      defense: 189,
      stamina: 190,
      type1_name: "grass",
      type2_name: "poison",
      moves: [
        move("Vine Whip", "grass", 1, 7, 600, 6),
        move("Frenzy Plant", "grass", 0, 100, 2600, -50),
      ],
    });
    const raidBoss = (name: string, moveType: string) =>
      pokemon({
        name,
        variant_id: `${name.toLowerCase()}-raid-target`,
        attack: 250,
        defense: 200,
        stamina: 220,
        type1_name: "water",
        type2_name: "none",
        moves: [
          move(`${moveType} Fast`, moveType, 1, 15, 1000, 10),
          move(`${moveType} Charged`, moveType, 0, 120, 2500, -100),
        ],
        raid_boss: [{ id: moveType, tier: "5", form: "Normal", name }],
      });
    const fireBoss = raidBoss("Fire Moveset Boss", "fire");
    const waterBoss = raidBoss("Water Moveset Boss", "water");

    const versusFire = scoreRaidTypeDps(
      [attacker],
      "grass",
      baseSettings,
      [fireBoss],
    )[0] as RaidTypeDpsScore;
    const versusWater = scoreRaidTypeDps(
      [attacker],
      "grass",
      baseSettings,
      [waterBoss],
    )[0] as RaidTypeDpsScore;

    expect(versusFire.tdo).toBeLessThan(versusWater.tdo);
    expect(versusFire.er).toBeLessThan(versusWater.er);
    expect(versusFire.eDps).toBeLessThan(versusWater.eDps);
  });

  it("dedupes overall attackers by effective DPS before paper ER", () => {
    const baseScore = scoreRaidOverallAttackers(
      [
        pokemon({
          name: "Raider",
          variant_id: "raider-default",
          attack: 220,
          defense: 190,
          stamina: 190,
          type1_name: "electric",
          type2_name: "none",
          moves: [
            move("Thunder Shock", "electric", 1, 5, 600, 8),
            move("Wild Charge", "electric", 0, 90, 2600, -50),
          ],
        }),
      ],
      baseSettings,
    )[0] as RaidOverallScore;
    const highPaperEr = {
      ...baseScore,
      dps: 40,
      tdo: 20,
      er: 50,
      eDps: 25,
      fastMove: move("Glass Cannon", "electric", 1, 8, 500, 6),
    };
    const higherEffectiveDps = {
      ...baseScore,
      dps: 30,
      tdo: 900,
      er: 40,
      eDps: 29,
      fastMove: move("Stable Shock", "electric", 1, 5, 600, 8),
    };

    expect(
      dedupeBestOverallAttackerPerVariant([highPaperEr, higherEffectiveDps])[0]
        ?.fastMove.name,
    ).toBe("Stable Shock");
  });

  it("keeps Mega Rayquaza above Crowned Shield Zamazenta on broad raid attacker scoring", () => {
    const megaRayquaza = pokemon({
      name: "Mega Rayquaza",
      variant_id: "rayquaza-mega",
      attack: 377,
      defense: 210,
      stamina: 227,
      type1_name: "dragon",
      type2_name: "flying",
      variantType: "mega",
      moves: [
        move("Air Slash", "flying", 1, 14, 1000, 10),
        move("Dragon Tail", "dragon", 1, 15, 1000, 9),
        move("Dragon Ascent", "flying", 0, 140, 3500, -50),
      ],
    });
    const crownedShieldZamazenta = pokemon({
      name: "Zamazenta",
      species_name: "Zamazenta",
      form: "Crowned_shield",
      variant_id: "zamazenta-crowned-shield",
      attack: 250,
      defense: 292,
      stamina: 192,
      type1_name: "fighting",
      type2_name: "steel",
      moves: [
        move("Metal Claw", "steel", 1, 8, 500, 7),
        move("Behemoth Bash", "steel", 0, 125, 1500, -50),
      ],
    });
    const scores = dedupeBestOverallAttackerPerVariant(
      scoreRaidOverallAttackers(
        [crownedShieldZamazenta, megaRayquaza],
        baseSettings,
      ),
    );

    expect(scores[0]?.variant.name).toBe("Mega Rayquaza");
    expect(scores[0]?.chargedMove.name).toBe("Dragon Ascent");
    expect(scores[0]?.eDps).toBeGreaterThan(scores[1]?.eDps ?? 0);
  });

  it("uses one neutral typeless benchmark for overall rankings", () => {
    expect(getRaidOverallTargetProfiles()).toEqual([
      { types: [], weight: 1 },
    ]);
  });

  it("only lets fusion variants use their matching fusion-exclusive raid moves", () => {
    const metalClaw = move("Metal Claw", "steel", 1, 8, 500, 7);
    const psychoCut = move("Psycho Cut", "psychic", 1, 5, 600, 8);
    const ironHead = move("Iron Head", "steel", 0, 60, 1900, -50);
    const psychic = move("Psychic", "psychic", 0, 90, 2800, -50);
    const sunsteelStrike = move(
      "Sunsteel Strike",
      "steel",
      0,
      230,
      3100,
      -100,
      {
        fusion_id: 1,
      },
    );
    const moongeistBeam = move("Moongeist Beam", "ghost", 0, 230, 3100, -100, {
      fusion_id: 2,
    });
    const solgaleo = pokemon({
      name: "Solgaleo",
      variant_id: "solgaleo-default",
      pokemon_id: 791,
      pokedex_number: 791,
      attack: 255,
      defense: 191,
      stamina: 264,
      type1_name: "psychic",
      type2_name: "steel",
      moves: [metalClaw, ironHead, sunsteelStrike],
    });
    const lunala = pokemon({
      name: "Lunala",
      variant_id: "lunala-default",
      pokemon_id: 792,
      pokedex_number: 792,
      attack: 255,
      defense: 191,
      stamina: 264,
      type1_name: "psychic",
      type2_name: "ghost",
      moves: [psychoCut, psychic, moongeistBeam],
    });
    const duskMane = pokemon({
      name: "Dusk Mane Necrozma",
      species_name: "Dusk Mane Necrozma",
      variant_id: "necrozma-fusion-1",
      pokemon_id: 800,
      pokedex_number: 800,
      attack: 277,
      defense: 220,
      stamina: 200,
      type1_name: "psychic",
      type2_name: "steel",
      variantType: "fusion_1",
      fusion_id: 1,
      moves: [metalClaw, ironHead, sunsteelStrike, moongeistBeam],
    });
    const dawnWings = pokemon({
      name: "Dawn Wings Necrozma",
      species_name: "Dawn Wings Necrozma",
      variant_id: "necrozma-fusion-2",
      pokemon_id: 800,
      pokedex_number: 800,
      attack: 277,
      defense: 220,
      stamina: 200,
      type1_name: "psychic",
      type2_name: "ghost",
      variantType: "fusion_2",
      fusion_id: 2,
      moves: [psychoCut, psychic, sunsteelStrike, moongeistBeam],
    });
    const scores = scoreRaidOverallAttackers(
      [solgaleo, lunala, duskMane, dawnWings],
      baseSettings,
    );
    const bestScores = scoreBestRaidOverallAttackers(
      [solgaleo, lunala, duskMane, dawnWings],
      baseSettings,
    );
    const movesByVariant = new Map<string, Set<string>>();
    scores.forEach((score) => {
      const names = movesByVariant.get(score.variant.name) ?? new Set<string>();
      names.add(score.chargedMove.name);
      movesByVariant.set(score.variant.name, names);
    });
    const bestChargedMoveByVariant = new Map(
      bestScores.map((score) => [score.variant.name, score.chargedMove.name]),
    );

    expect(movesByVariant.get("Solgaleo")).not.toContain("Sunsteel Strike");
    expect(movesByVariant.get("Lunala")).not.toContain("Moongeist Beam");
    expect(movesByVariant.get("Dusk Mane Necrozma")).toContain(
      "Sunsteel Strike",
    );
    expect(movesByVariant.get("Dusk Mane Necrozma")).not.toContain(
      "Moongeist Beam",
    );
    expect(movesByVariant.get("Dawn Wings Necrozma")).toContain(
      "Moongeist Beam",
    );
    expect(movesByVariant.get("Dawn Wings Necrozma")).not.toContain(
      "Sunsteel Strike",
    );
    expect(bestChargedMoveByVariant.get("Solgaleo")).not.toBe(
      "Sunsteel Strike",
    );
    expect(bestChargedMoveByVariant.get("Lunala")).not.toBe("Moongeist Beam");
    expect(bestChargedMoveByVariant.get("Dusk Mane Necrozma")).toBe(
      "Sunsteel Strike",
    );
    expect(bestChargedMoveByVariant.get("Dawn Wings Necrozma")).toBe(
      "Moongeist Beam",
    );
  });

  it("matches full overall scoring when taking the best moveset per variant", () => {
    const attackers = [
      legendaryRaidTarget({
        name: "Mega Rayquaza",
        variant_id: "rayquaza-mega",
        attack: 377,
        defense: 210,
        stamina: 227,
        type1_name: "dragon",
        type2_name: "flying",
        variantType: "mega",
        moves: [
          move("Air Slash", "flying", 1, 14, 1000, 10),
          move("Dragon Tail", "dragon", 1, 15, 1000, 9),
          move("Outrage", "dragon", 0, 110, 3900, -50),
          move("Dragon Ascent", "flying", 0, 140, 3500, -50),
        ],
      }),
      pokemon({
        name: "Zamazenta",
        variant_id: "zamazenta-crowned-shield",
        attack: 250,
        defense: 292,
        stamina: 192,
        type1_name: "fighting",
        type2_name: "steel",
        moves: [
          move("Metal Claw", "steel", 1, 8, 500, 7),
          move("Ice Fang", "ice", 1, 12, 1000, 8),
          move("Behemoth Bash", "steel", 0, 125, 1500, -50),
        ],
      }),
    ];
    const fullBest = dedupeBestOverallAttackerPerVariant(
      scoreRaidOverallAttackers(attackers, baseSettings),
    );
    const fastBest = scoreBestRaidOverallAttackers(attackers, baseSettings);

    expect(fastBest.map((score) => score.variant.variant_id)).toEqual(
      fullBest.map((score) => score.variant.variant_id),
    );
    expect(fastBest[0]?.fastMove.name).toBe(fullBest[0]?.fastMove.name);
    expect(fastBest[0]?.chargedMove.name).toBe(fullBest[0]?.chargedMove.name);
    expect(fastBest[0]?.er).toBeCloseTo(fullBest[0]?.er ?? 0, 6);
    expect(fastBest[0]?.eDps).toBeCloseTo(fullBest[0]?.eDps ?? 0, 6);
  });

  it("selects the strongest legal Hidden Power roll for overall raid targets", () => {
    const regigigas = pokemon({
      name: "Shadow Regigigas",
      variant_id: "regigigas-shadow",
      pokemon_id: 486,
      pokedex_number: 486,
      attack: 287,
      defense: 210,
      stamina: 221,
      type1_name: "normal",
      type2_name: "none",
      variantType: "shadow",
      moves: [
        move("Hidden Power", "normal", 1, 15, 1500, 15),
        move("Giga Impact", "normal", 0, 200, 4700, -100),
      ],
    });
    const electricTarget = legendaryRaidTarget({
      name: "Electric Raid Boss",
      variant_id: "electric-target",
      type1_name: "electric",
      type2_name: "none",
    });

    const [score] = scoreBestRaidOverallAttackers(
      [regigigas],
      baseSettings,
      [electricTarget],
    );

    expect(score?.fastMove.name).toBe("Hidden Power (Ground)");
    expect(score?.fastMove.type).toBe("ground");
  });

  it("selects Psystrike over Shadow Ball for neutral Mega Mewtwo Y output", () => {
    const megaMewtwoY = pokemon({
      name: "Mega Mewtwo Y",
      variant_id: "mewtwo-mega-y",
      pokemon_id: 150,
      pokedex_number: 150,
      attack: 388,
      defense: 202,
      stamina: 228,
      type1_name: "psychic",
      type2_name: "none",
      variantType: "mega",
      moves: [
        move("Psycho Cut", "psychic", 1, 5, 600, 8),
        move("Confusion", "psychic", 1, 20, 1600, 15),
        move("Psystrike", "psychic", 0, 95, 2300, -50),
        move("Shadow Ball", "ghost", 0, 100, 3000, -50),
      ],
    });

    const [score] = scoreBestRaidOverallAttackers(
      [megaMewtwoY],
      baseSettings,
    );

    expect(score?.chargedMove.name).toBe("Psystrike");
  });

  it("exposes Hidden Power as the selected type on theoretical type pages", () => {
    const regigigas = pokemon({
      name: "Shadow Regigigas",
      variant_id: "regigigas-shadow",
      variantType: "shadow",
      type1_name: "normal",
      type2_name: "none",
      moves: [
        move("Hidden Power", "normal", 1, 15, 1500, 15),
        move("Giga Impact", "normal", 0, 200, 4700, -100),
      ],
    });

    const scores = dedupeBestTypeDpsPerVariant(
      scoreRaidTypeDps([regigigas], "ice", baseSettings),
    );

    expect(scores).toHaveLength(1);
    expect(scores[0]?.fastMove.name).toBe("Hidden Power (Ice)");
    expect(scores[0]?.fastMove.type).toBe("ice");
    expect(scores[0]?.fastMatchesType).toBe(true);
    expect(scores[0]?.fastEffectiveness).toBe(1.6);
  });

  it("does not grant Regigigas STAB for a rolled Hidden Power type", () => {
    const hiddenPowerWater = move(
      "Hidden Power (Water)",
      "water",
      1,
      15,
      1500,
      15,
    );
    const regigigas = pokemon({
      name: "Shadow Regigigas",
      variant_id: "regigigas-shadow",
      type1_name: "normal",
      type2_name: "none",
      variantType: "shadow",
    });
    const waterAttacker = pokemon({
      name: "Shadow Water Attacker",
      variant_id: "water-shadow",
      type1_name: "water",
      type2_name: "none",
      variantType: "shadow",
    });

    const regigigasScore = calculateTypeMoveCycleScore(
      regigigas,
      hiddenPowerWater,
      move("Crush Grip", "normal", 0, 210, 2000, -100),
      "water",
      baseSettings,
    );
    const waterAttackerScore = calculateTypeMoveCycleScore(
      waterAttacker,
      hiddenPowerWater,
      move("Off-type Charge", "normal", 0, 210, 2000, -100),
      "water",
      baseSettings,
    );

    expect(waterAttackerScore.fastDamage).toBeGreaterThan(
      regigigasScore.fastDamage,
    );
  });

  it("uses real raid typings so Rock bosses resist Regigigas's Crush Grip", () => {
    const regigigas = pokemon({
      name: "Shadow Regigigas",
      variant_id: "regigigas-shadow",
      type1_name: "normal",
      type2_name: "none",
      variantType: "shadow",
      moves: [
        move("Hidden Power", "normal", 1, 15, 1500, 15),
        move("Crush Grip", "normal", 0, 210, 2000, -100),
      ],
    });
    const rockRaidBoss = pokemon({
      name: "Rock Raid Boss",
      variant_id: "rock-raid-boss",
      type1_name: "rock",
      type2_name: "none",
      raid_boss: [
        { id: 99, tier: "5", form: "Normal", name: "Rock Raid Boss" },
      ],
    });

    const synthetic = dedupeBestTypeDpsPerVariant(
      scoreRaidTypeDps([regigigas], "water", baseSettings),
    )[0] as RaidTypeDpsScore;
    const raidAffinity = dedupeBestTypeDpsPerVariant(
      scoreRaidTypeDps(
        [regigigas],
        "water",
        baseSettings,
        [rockRaidBoss],
      ),
    )[0] as RaidTypeDpsScore;

    expect(raidAffinity.fastEffectiveness).toBe(1.6);
    expect(raidAffinity.chargedEffectiveness).toBe(0.625);
    expect(raidAffinity.dps).toBeLessThan(synthetic.dps);
    expect(raidAffinity.eDps).toBeLessThan(synthetic.eDps);
  });

  it("selects a matchup-effective Hidden Power roll for boss counters", () => {
    const regigigas = pokemon({
      name: "Shadow Regigigas",
      variant_id: "regigigas-shadow",
      variantType: "shadow",
      type1_name: "normal",
      type2_name: "none",
      moves: [
        move("Hidden Power", "normal", 1, 15, 1500, 15),
        move("Giga Impact", "normal", 0, 200, 4700, -100),
      ],
    });
    const electricBoss = pokemon({
      name: "Electric Raid Boss",
      variant_id: "electric-boss",
      type1_name: "electric",
      type2_name: "none",
    });

    const [score] = scoreRaidCounters(
      [regigigas],
      electricBoss,
      RAID_TIER_PRESETS.legendary,
      baseSettings,
    );

    expect(score?.fastMove.name).toBe("Hidden Power (Ground)");
    expect(score?.fastMove.type).toBe("ground");
  });

  it("ranks type DPS when either the fast or charged move matches the selected type", () => {
    const tyranitar = pokemon({
      name: "Tyranitar",
      variant_id: "tyranitar-default",
      attack: 251,
      defense: 207,
      stamina: 225,
      type1_name: "rock",
      type2_name: "dark",
      moves: [
        move("Bite", "dark", 1, 6, 500, 4),
        move("Brutal Swing", "dark", 0, 65, 1900, -33),
      ],
    });
    const absol = pokemon({
      name: "Absol",
      variant_id: "absol-default",
      attack: 246,
      defense: 120,
      stamina: 163,
      type1_name: "dark",
      type2_name: "none",
      moves: [
        move("Psycho Cut", "psychic", 1, 5, 600, 8),
        move("Dark Pulse", "dark", 0, 80, 3000, -50),
      ],
    });
    const mandibuzz = pokemon({
      name: "Mandibuzz",
      variant_id: "mandibuzz-default",
      attack: 129,
      defense: 205,
      stamina: 242,
      type1_name: "dark",
      type2_name: "flying",
      moves: [
        move("Snarl", "dark", 1, 12, 1100, 14),
        move("Aerial Ace", "flying", 0, 55, 2400, -33),
      ],
    });
    const gengar = pokemon({
      name: "Gengar",
      variant_id: "gengar-default",
      attack: 261,
      defense: 149,
      stamina: 155,
      type1_name: "ghost",
      type2_name: "poison",
      moves: [
        move("Lick", "ghost", 1, 5, 500, 6),
        move("Shadow Ball", "ghost", 0, 100, 3000, -50),
      ],
    });
    const shinyTyranitar = pokemon({
      name: "Shiny Tyranitar",
      variant_id: "tyranitar-shiny",
      variantType: "shiny",
      moves: [
        move("Bite", "dark", 1, 6, 500, 4),
        move("Brutal Swing", "dark", 0, 65, 1900, -33),
      ],
    });

    const scores = scoreRaidTypeDps(
      [tyranitar, absol, mandibuzz, gengar, shinyTyranitar],
      "dark",
      baseSettings,
    );
    const scoreNames = scores.map((score) => score.variant.name);
    const absolScore = scores.find((score) => score.variant.name === "Absol");
    const mandibuzzScore = scores.find(
      (score) => score.variant.name === "Mandibuzz",
    );

    expect(scoreNames).toContain("Tyranitar");
    expect(scoreNames).toContain("Absol");
    expect(scoreNames).toContain("Mandibuzz");
    expect(scoreNames).not.toContain("Gengar");
    expect(scoreNames).not.toContain("Shiny Tyranitar");
    expect(absolScore?.targetEffectiveness).toBe(1.6);
    expect(absolScore?.fastMatchesType).toBe(false);
    expect(absolScore?.chargedMatchesType).toBe(true);
    expect(absolScore?.fastEffectiveness).toBe(1);
    expect(absolScore?.chargedEffectiveness).toBe(1.6);
    expect(absolScore?.eDps).toBeGreaterThan(0);
    expect(absolScore?.eDps ?? 0).toBeLessThan(absolScore?.dps ?? 0);
    expect(absolScore?.tdo).toBeGreaterThan(0);
    expect(absolScore?.er).toBeGreaterThan(0);
    expect(mandibuzzScore?.fastMatchesType).toBe(true);
    expect(mandibuzzScore?.chargedMatchesType).toBe(false);
    expect(mandibuzzScore?.fastEffectiveness).toBe(1.6);
    expect(mandibuzzScore?.chargedEffectiveness).toBe(1);
    expect(
      dedupeBestTypeDpsPerVariant(scores).filter(
        (score) => score.variant.name === "Tyranitar",
      ),
    ).toHaveLength(1);
  });

  it("does not boost off-type companion moves on theoretical type DPS pages", () => {
    const megaAbsol = pokemon({
      name: "Mega Absol",
      variant_id: "absol-mega",
      attack: 314,
      defense: 130,
      stamina: 163,
      type1_name: "dark",
      type2_name: "none",
      variantType: "mega",
      moves: [
        move("Snarl", "dark", 1, 12, 1100, 14),
        move("Megahorn", "bug", 0, 110, 2200, -100),
      ],
    });
    const shadowSneasler = pokemon({
      name: "Shadow Sneasler",
      variant_id: "sneasler-shadow",
      attack: 259,
      defense: 158,
      stamina: 190,
      type1_name: "fighting",
      type2_name: "poison",
      variantType: "shadow",
      moves: [
        move("Shadow Claw", "ghost", 1, 9, 700, 6),
        move("X-Scissor", "bug", 0, 45, 1600, -33),
      ],
    });
    const pheromosa = pokemon({
      name: "Pheromosa",
      variant_id: "pheromosa-default",
      attack: 316,
      defense: 85,
      stamina: 174,
      type1_name: "bug",
      type2_name: "fighting",
      variantType: "default",
      moves: [
        move("Bug Bite", "bug", 1, 5, 500, 6),
        move("Bug Buzz", "bug", 0, 100, 3700, -50),
      ],
    });

    const scores = scoreRaidTypeDps(
      [megaAbsol, shadowSneasler, pheromosa],
      "bug",
      baseSettings,
    );
    const megaAbsolScore = scores.find(
      (score) => score.variant.name === "Mega Absol",
    );
    const shadowSneaslerScore = scores.find(
      (score) => score.variant.name === "Shadow Sneasler",
    );
    const pheromosaScore = scores.find(
      (score) => score.variant.name === "Pheromosa",
    );

    expect(megaAbsolScore?.fastMatchesType).toBe(false);
    expect(megaAbsolScore?.chargedMatchesType).toBe(true);
    expect(megaAbsolScore?.fastEffectiveness).toBe(1);
    expect(megaAbsolScore?.chargedEffectiveness).toBe(1.6);
    expect(shadowSneaslerScore?.fastMatchesType).toBe(false);
    expect(shadowSneaslerScore?.chargedMatchesType).toBe(true);
    expect(shadowSneaslerScore?.fastEffectiveness).toBe(1);
    expect(shadowSneaslerScore?.chargedEffectiveness).toBe(1.6);
    expect(pheromosaScore?.fastEffectiveness).toBe(1.6);
    expect(pheromosaScore?.chargedEffectiveness).toBe(1.6);
    expect(scores[0]?.variant.name).toBe("Pheromosa");
  });

  it("ranks type pages with complete moveset metrics while keeping off-type damage neutral", () => {
    const megaAbsol = pokemon({
      name: "Mega Absol",
      variant_id: "absol-mega",
      attack: 314,
      defense: 130,
      stamina: 163,
      type1_name: "dark",
      type2_name: "none",
      variantType: "mega",
      moves: [
        move("Snarl", "dark", 1, 12, 1100, 14),
        move("Megahorn", "bug", 0, 110, 2200, -100),
      ],
    });
    const vikavolt = pokemon({
      name: "Vikavolt",
      variant_id: "vikavolt-default",
      attack: 254,
      defense: 158,
      stamina: 184,
      type1_name: "bug",
      type2_name: "electric",
      moves: [
        move("Bug Bite", "bug", 1, 5, 500, 6),
        move("Fly", "flying", 0, 80, 1800, -50),
      ],
    });
    const pheromosa = pokemon({
      name: "Pheromosa",
      variant_id: "pheromosa-default",
      attack: 316,
      defense: 85,
      stamina: 174,
      type1_name: "bug",
      type2_name: "fighting",
      moves: [
        move("Bug Bite", "bug", 1, 5, 500, 6),
        move("Bug Buzz", "bug", 0, 100, 3700, -50),
      ],
    });

    const scores = scoreRaidTypeDps(
      [megaAbsol, vikavolt, pheromosa],
      "bug",
      baseSettings,
    );
    const scoreNames = scores.map((score) => score.variant.name);
    const megaAbsolScore = scores.find(
      (score) => score.variant.name === "Mega Absol",
    );
    const pheromosaScore = scores.find(
      (score) => score.variant.name === "Pheromosa",
    );

    expect(scoreNames.indexOf("Pheromosa")).toBeLessThan(
      scoreNames.indexOf("Mega Absol"),
    );
    expect(megaAbsolScore?.totalDps).toBeCloseTo(megaAbsolScore?.dps ?? 0);
    expect(megaAbsolScore?.eDps ?? 0).toBeLessThan(
      megaAbsolScore?.dps ?? 0,
    );
    expect(pheromosaScore?.totalDps).toBeGreaterThan(0);
    expect(pheromosaScore?.dps).toBeGreaterThan(megaAbsolScore?.dps ?? 0);
  });

  it("dedupes type DPS movesets using eDPS before the supporting metrics", () => {
    const baseScore = scoreRaidTypeDps(
      [
        pokemon({
          name: "Bugmon",
          variant_id: "bugmon-default",
          attack: 200,
          defense: 200,
          stamina: 200,
          type1_name: "bug",
          type2_name: "none",
          moves: [
            move("Bug Bite", "bug", 1, 5, 500, 6),
            move("Bug Buzz", "bug", 0, 100, 3700, -50),
          ],
        }),
      ],
      "bug",
      baseSettings,
    )[0] as RaidTypeDpsScore;
    const highErLowerEffectiveDps = {
      ...baseScore,
      dps: 40,
      eDps: 20,
      tdo: 900,
      er: 45,
      fastMove: move("Enduring Bite", "bug", 1, 9, 500, 6),
    };
    const lowerErHigherEffectiveDps = {
      ...baseScore,
      dps: 30,
      eDps: 25,
      tdo: 400,
      er: 35,
      fastMove: move("Effective Bite", "bug", 1, 5, 500, 6),
    };

    expect(
      dedupeBestTypeDpsPerVariant([
        highErLowerEffectiveDps,
        lowerErHigherEffectiveDps,
      ])[0]?.fastMove.name,
    ).toBe("Effective Bite");
  });
});

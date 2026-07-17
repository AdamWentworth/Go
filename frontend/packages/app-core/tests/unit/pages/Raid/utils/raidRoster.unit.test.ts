import { describe, expect, it } from "vitest";

import {
  calculateRaidAttackerCp,
  getRaidAttackerIvs,
  resolveRaidAttackerLevel,
} from "@/pages/Raid/utils/raidAttackerModel";
import {
  getLegalRaidChargedMoves,
  getLegalRaidFastMoves,
} from "@/pages/Raid/utils/raidCatalog";
import { buildRaidRoster } from "@/pages/Raid/utils/raidRoster";
import { calculateRaidAttackerBattleStats } from "@/pages/Raid/utils/raidTargetModel";
import { scoreBestRaidOverallAttackers } from "@/pages/Raid/utils/raidRankings";
import { cpMultipliers } from "@/pages/Raid/utils/constants";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  CrownForm,
  Fusion,
  MegaEvolution,
  Move,
} from "@/types/pokemonSubTypes";

const move = (
  moveId: number,
  name: string,
  isFast: 0 | 1,
): Move =>
  ({
    move_id: moveId,
    name,
    is_fast: isFast,
    raid_power: isFast ? 10 : 100,
    raid_energy: isFast ? 10 : -50,
    raid_cooldown: isFast ? 500 : 2500,
    type: "electric",
    type_name: "electric",
  }) as Move;

const baseVariant = (overrides: Partial<PokemonVariant> = {}): PokemonVariant =>
  ({
    pokemon_id: 25,
    pokedex_number: 25,
    name: "Pikachu",
    species_name: "Pikachu",
    variant_id: "pikachu-default",
    variantType: "default",
    currentImage: "/pikachu.png",
    attack: 112,
    defense: 96,
    stamina: 111,
    type1_name: "electric",
    type2_name: "none",
    moves: [
      move(1, "Thunder Shock", 1),
      move(2, "Quick Attack", 1),
      move(3, "Wild Charge", 0),
      move(4, "Thunderbolt", 0),
    ],
    ...overrides,
  }) as PokemonVariant;

const instance = (
  overrides: Partial<PokemonInstance> = {},
): PokemonInstance =>
  ({
    variant_id: "pikachu-default",
    pokemon_id: 25,
    is_caught: true,
    disabled: false,
    cp: 938,
    level: 40,
    attack_iv: 15,
    defense_iv: 14,
    stamina_iv: 13,
    fast_move_id: 1,
    charged_move1_id: 3,
    charged_move2_id: null,
    ...overrides,
  }) as PokemonInstance;

describe("personalized raid roster", () => {
  it("keeps caught copies distinct and excludes non-caught or disabled records", () => {
    const summary = buildRaidRoster([baseVariant()], {
      first: instance({ instance_id: "first" }),
      second: instance({ instance_id: "second", cp: 900 }),
      wanted: instance({ instance_id: "wanted", is_caught: false }),
      disabled: instance({ instance_id: "disabled", disabled: true }),
    });

    expect(summary.caughtCount).toBe(2);
    expect(summary.eligibleCount).toBe(2);
    expect(summary.attackers.map((attacker) => attacker.variant_id)).toEqual([
      "pikachu-default::caught::first::base",
      "pikachu-default::caught::second::base",
    ]);
  });

  it("lists an unlocked Mega separately from the same caught Pokemon", () => {
    const rayquaza = baseVariant({
      pokemon_id: 384,
      pokedex_number: 384,
      name: "Rayquaza",
      species_name: "Rayquaza",
      variant_id: "0384-default",
      attack: 284,
      defense: 170,
      stamina: 213,
      megaEvolutions: [
        {
          id: 36,
          form: null,
          mega_energy_cost: 400,
          attack: 377,
          defense: 210,
          stamina: 227,
          type1_name: "Dragon",
          type2_name: "Flying",
          type_1_id: 3,
          type_2_id: 8,
          date_available: "2023-08-04",
        } as MegaEvolution,
      ],
    });
    const megaRayquaza = baseVariant({
      ...rayquaza,
      name: "Mega Rayquaza",
      species_name: "Rayquaza",
      variant_id: "0384-mega",
      variantType: "mega",
      attack: 377,
      defense: 210,
      stamina: 227,
      megaForm: "",
    });
    const summary = buildRaidRoster([rayquaza, megaRayquaza], {
      rayquaza: instance({
        instance_id: "rayquaza",
        variant_id: rayquaza.variant_id,
        pokemon_id: 384,
        cp: 3835,
        mega: true,
        is_mega: false,
      }),
    });

    expect(summary.caughtCount).toBe(1);
    expect(summary.eligibleCount).toBe(2);
    expect(summary.projectedFormCount).toBe(1);
    expect(summary.attackers.map((attacker) => attacker.name)).toEqual([
      "Rayquaza",
      "Mega Rayquaza",
    ]);
    expect(summary.attackers.map((attacker) => attacker.raidRoster?.formSource)).toEqual([
      "base",
      "mega",
    ]);
    expect(summary.attackers[0].raidRoster?.cpSource).toBe("recorded");
    expect(summary.attackers[1].raidRoster?.cpSource).toBe("calculated");
    expect(calculateRaidAttackerCp(summary.attackers[0], "50.0")).toBe(3835);
    expect(calculateRaidAttackerCp(summary.attackers[1], "50.0")).toBeGreaterThan(3835);
  });

  it("lists every unlocked Mega choice alongside a species' caught base form", () => {
    const megaFast = move(30, "Psycho Cut", 1);
    const megaCharged = move(31, "Psystrike", 0);
    const mewtwo = baseVariant({
      pokemon_id: 150,
      pokedex_number: 150,
      name: "Mewtwo",
      species_name: "Mewtwo",
      variant_id: "0150-default",
      moves: [megaFast, megaCharged],
      megaEvolutions: [
        {
          id: 37,
          form: "X",
          mega_energy_cost: 200,
          date_available: "2026-07-13",
          attack: 375,
          defense: 202,
          stamina: 214,
          type1_name: "Psychic",
          type2_name: "Fighting",
          type_1_id: 15,
          type_2_id: 7,
        } as MegaEvolution,
        {
          id: 38,
          form: "Y",
          mega_energy_cost: 200,
          date_available: "2026-07-13",
          attack: 426,
          defense: 229,
          stamina: 214,
          type1_name: "Psychic",
          type_1_id: 15,
        } as MegaEvolution,
      ],
    });
    const megaX = baseVariant({
      ...mewtwo,
      name: "Mega Mewtwo X",
      variant_id: "0150-mega-x",
      variantType: "mega_x",
      megaForm: "X",
      attack: 375,
      defense: 202,
      stamina: 214,
      moves: [megaFast, megaCharged],
    });
    const megaY = baseVariant({
      ...mewtwo,
      name: "Mega Mewtwo Y",
      variant_id: "0150-mega-y",
      variantType: "mega_y",
      megaForm: "Y",
      attack: 426,
      defense: 229,
      stamina: 214,
      moves: [megaFast, megaCharged],
    });
    const summary = buildRaidRoster([mewtwo, megaX, megaY], {
      mewtwo: instance({
        instance_id: "mewtwo",
        variant_id: mewtwo.variant_id,
        pokemon_id: 150,
        fast_move_id: 30,
        charged_move1_id: 31,
        mega: true,
        is_mega: false,
      }),
    });

    expect(summary.caughtCount).toBe(1);
    expect(summary.eligibleCount).toBe(3);
    expect(summary.projectedFormCount).toBe(2);
    expect(summary.attackers.map((attacker) => attacker.name)).toEqual([
      "Mewtwo",
      "Mega Mewtwo X",
      "Mega Mewtwo Y",
    ]);
    expect(
      summary.attackers.map((attacker) => attacker.raidRoster?.cpSource),
    ).toEqual(["recorded", "calculated", "calculated"]);
  });

  it("uses the selected fusion form instead of the stored base variant", () => {
    const fusionFast = move(10, "Shadow Claw", 1);
    const fusionCharged = move(11, "Moongeist Beam", 0);
    const necrozma = baseVariant({
      pokemon_id: 800,
      pokedex_number: 800,
      name: "Necrozma",
      species_name: "Necrozma",
      variant_id: "0800-default",
      fusion: [
        {
          fusion_id: 2,
          name: "Dawn Wings Necrozma",
          base_pokemon_id1: 800,
          base_pokemon_id2: 792,
          type_1_id: 15,
          type_2_id: 9,
          type1_name: "Psychic",
          type2_name: "Ghost",
          date_available: "2024-05-30",
          moves: [fusionFast, fusionCharged],
        } as Fusion,
      ],
    });
    const dawnWings = baseVariant({
      ...necrozma,
      name: "Dawn Wings Necrozma",
      species_name: "Dawn Wings Necrozma",
      variant_id: "0800-fusion_2",
      variantType: "fusion_2",
      fusion_id: 2,
      attack: 277,
      defense: 220,
      stamina: 200,
      currentImage: "/dawn-wings.png",
      moves: [fusionFast, fusionCharged],
    });
    const summary = buildRaidRoster([necrozma, dawnWings], {
      necrozma: instance({
        instance_id: "necrozma",
        variant_id: necrozma.variant_id,
        pokemon_id: 800,
        fast_move_id: 10,
        charged_move1_id: 11,
        is_fused: true,
        fusion_form: "Dawn Wings Necrozma",
      }),
    });

    expect(summary.eligibleCount).toBe(1);
    expect(summary.projectedFormCount).toBe(1);
    expect(summary.attackers[0]).toMatchObject({
      name: "Dawn Wings Necrozma",
      attack: 277,
      currentImage: "/dawn-wings.png",
      fusion_id: 2,
    });
    expect(summary.attackers[0].raidRoster).toMatchObject({
      formSource: "fusion",
      cpSource: "recorded",
    });
  });

  it("projects a caught crowned form with its own stats, image, and moves", () => {
    const crownFast = move(20, "Metal Claw", 1);
    const crownCharged = move(21, "Behemoth Blade", 0);
    const zacian = baseVariant({
      pokemon_id: 888,
      pokedex_number: 888,
      name: "Zacian",
      species_name: "Zacian",
      variant_id: "0888-default",
      crownForms: [
        {
          id: 1,
          base_pokemon_id: 888,
          crown_pokemon_id: 1888,
          display_form: "Crowned Sword",
          name: "Zacian",
          image_url: "/crowned-zacian.png",
          attack: 332,
          defense: 240,
          stamina: 192,
          type_1_id: 5,
          type_2_id: 17,
          type1_name: "Fairy",
          type2_name: "Steel",
          moves: [crownFast, crownCharged],
        } as CrownForm,
      ],
    });
    const summary = buildRaidRoster([zacian], {
      zacian: instance({
        instance_id: "zacian",
        variant_id: zacian.variant_id,
        pokemon_id: 888,
        fast_move_id: 20,
        charged_move1_id: 21,
        crown: true,
      }),
    });

    expect(summary.eligibleCount).toBe(1);
    expect(summary.projectedFormCount).toBe(1);
    expect(summary.attackers[0]).toMatchObject({
      name: "Crowned Sword Zacian",
      attack: 332,
      defense: 240,
      stamina: 192,
      currentImage: "/crowned-zacian.png",
    });
    expect(summary.attackers[0].raidRoster?.formSource).toBe("crown");
  });

  it("uses recorded moves and preserves both recorded Charged Attacks", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        fast_move_id: 2,
        charged_move1_id: 4,
        charged_move2_id: 3,
      }),
    });
    const [attacker] = summary.attackers;

    expect(attacker.raidRoster?.moveSource).toBe("recorded");
    expect(getLegalRaidFastMoves(attacker).map((entry) => entry.name)).toEqual([
      "Quick Attack",
    ]);
    expect(
      getLegalRaidChargedMoves(attacker).map((entry) => entry.name),
    ).toEqual(["Wild Charge", "Thunderbolt"]);
  });

  it("omits caught entries whose current moves are incomplete", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({ fast_move_id: null, charged_move1_id: null }),
    });

    expect(summary.incompleteMoveCount).toBe(1);
    expect(summary.incompleteEntryCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("allows cosmetic and Max catches to participate as real owned attackers", () => {
    const shinyMax = baseVariant({
      variant_id: "pikachu-shiny-dynamax",
      variantType: "shiny_dynamax",
    });
    const summary = buildRaidRoster([shinyMax], {
      pikachu: instance({ variant_id: shinyMax.variant_id }),
    });

    expect(summary.eligibleCount).toBe(1);
  });

  it("uses recorded level, IVs, and CP instead of the catalog benchmark", () => {
    const [attacker] = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        cp: 777,
        level: 35,
        attack_iv: 10,
        defense_iv: 11,
        stamina_iv: 12,
      }),
    }).attackers;
    const settings = {
      attackerLevel: "50.0",
      friendship: "none",
      megaAllyBonus: "none",
      partyPower: "none",
      dodgeStrategy: "none",
      weatherBoostedType: "",
      shadowBossMode: "normal",
      bossMovesetMode: "expected",
      relobbySeconds: 10,
    } as const;
    const stats = calculateRaidAttackerBattleStats(attacker, settings);

    expect(resolveRaidAttackerLevel(attacker, "50.0")).toBe("35.0");
    expect(getRaidAttackerIvs(attacker)).toEqual({
      attack: 10,
      defense: 11,
      stamina: 12,
    });
    expect(calculateRaidAttackerCp(attacker, "50.0")).toBe(777);
    expect(stats.attack).toBeCloseTo((112 + 10) * cpMultipliers["35.0"]);
  });

  it("ranks caught copies using their real levels instead of the level 50 benchmark", () => {
    const attackers = buildRaidRoster([baseVariant()], {
      level30: instance({ instance_id: "level-30", cp: null, level: 30 }),
      level40: instance({ instance_id: "level-40", cp: null, level: 40 }),
    }).attackers;
    const settings = {
      attackerLevel: "50.0",
      friendship: "none",
      megaAllyBonus: "none",
      partyPower: "none",
      dodgeStrategy: "none",
      weatherBoostedType: "",
      shadowBossMode: "normal",
      bossMovesetMode: "expected",
      relobbySeconds: 10,
    } as const;

    const scores = scoreBestRaidOverallAttackers(attackers, settings, []);

    expect(resolveRaidAttackerLevel(scores[0].variant, "50.0")).toBe("40.0");
    expect(resolveRaidAttackerLevel(scores[1].variant, "50.0")).toBe("30.0");
    expect(scores[0].cp).toBeGreaterThan(scores[1].cp);
    expect(scores[0].dps).toBeGreaterThan(scores[1].dps);
  });

  it("infers a missing level from recorded CP and IVs", () => {
    const catalog = baseVariant();
    const level40Cp = calculateRaidAttackerCp(
      {
        ...catalog,
        instanceData: instance({ cp: null, level: 40 }),
      },
      "40.0",
    );
    const [attacker] = buildRaidRoster([catalog], {
      pikachu: instance({ cp: level40Cp, level: null }),
    }).attackers;

    expect(attacker.raidRoster?.levelSource).toBe("inferred");
    expect(resolveRaidAttackerLevel(attacker, "50.0")).toBe("40.0");
  });

  it("omits caught entries instead of inventing hundo IVs", () => {
    const summary = buildRaidRoster([baseVariant()], {
      pikachu: instance({
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
      }),
    });

    expect(summary.incompleteIvCount).toBe(1);
    expect(summary.incompleteEntryCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("never promotes an incomplete caught attacker to the level 50 benchmark", () => {
    const shadowRegigigas = baseVariant({
      pokemon_id: 486,
      pokedex_number: 486,
      name: "Shadow Regigigas",
      species_name: "Regigigas",
      variant_id: "regigigas-shadow",
      variantType: "shadow",
      attack: 287,
      defense: 210,
      stamina: 221,
    });
    const summary = buildRaidRoster([shadowRegigigas], {
      regigigas: instance({
        variant_id: shadowRegigigas.variant_id,
        pokemon_id: shadowRegigigas.pokemon_id,
        cp: null,
        level: null,
      }),
    });

    expect(summary.incompleteLevelCount).toBe(1);
    expect(summary.attackers).toHaveLength(0);
  });

  it("marks an unknown recorded Hidden Power roll as estimated without replacing the move", () => {
    const hiddenPowerVariant = baseVariant({
      moves: [
        move(10, "Hidden Power", 1),
        move(3, "Wild Charge", 0),
      ],
    });
    const [attacker] = buildRaidRoster([hiddenPowerVariant], {
      pikachu: instance({ fast_move_id: 10 }),
    }).attackers;

    expect(attacker.raidRoster?.moveSource).toBe("recorded");
    expect(attacker.raidRoster?.hiddenPowerTypeEstimated).toBe(true);
    expect(getLegalRaidFastMoves(attacker)).toHaveLength(16);
  });
});

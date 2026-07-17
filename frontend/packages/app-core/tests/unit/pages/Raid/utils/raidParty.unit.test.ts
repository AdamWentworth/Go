import { describe, expect, it } from "vitest";

import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  RaidCounterScore,
  RaidCounterSettings,
} from "@/pages/Raid/utils/raidTypes";
import {
  applyRaidPartyTrainersToDrafts,
  buildRaidPartyTrainer,
  createRaidPartyTrainerDraft,
  getRaidPartyScenarioKey,
} from "@/pages/Raid/utils/raidParty";

const settings = {
  attackerLevel: "50.0",
  friendship: "none",
  megaAllyBonus: "matching",
  partyPower: "none",
  dodgeStrategy: "none",
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
} satisfies RaidCounterSettings;

const score = (id: string, variantType = "default", dps = 20) =>
  ({
    variant: {
      variant_id: id,
      variantType,
      name: id,
    } as PokemonVariant,
    fastMove: { name: "Fast" },
    chargedMove: { name: "Charged" },
    dps,
    soloTimeSeconds: 100,
  }) as RaidCounterScore;

describe("raid party builder rules", () => {
  it("auto-fills a legal six-member team", () => {
    const scores = Array.from({ length: 8 }, (_, index) =>
      score(`pokemon-${index}`, "default", 30 - index),
    );
    const draft = createRaidPartyTrainerDraft(0, scores, settings);

    expect(draft.memberVariantIds).toHaveLength(6);
    expect(new Set(draft.memberVariantIds).size).toBe(6);
  });

  it("enforces unique roster slots and one Mega or Primal", () => {
    const scores = [
      score("mega-one", "mega", 40),
      score("mega-two", "mega", 39),
      score("regular", "default", 30),
    ];
    const trainer = buildRaidPartyTrainer(
      {
        id: "trainer-1",
        label: "Adam",
        memberVariantIds: ["mega-one", "mega-two", "regular"],
        dodgeStrategy: "charged",
        dodgeSuccessRate: 2,
        relobbySeconds: -5,
        actionDelaySeconds: -1,
      },
      scores,
      settings,
    );

    expect(trainer).not.toBeNull();
    expect(
      trainer?.team.filter((member) =>
        member.attacker.variantType.includes("mega"),
      ),
    ).toHaveLength(1);
    expect(trainer?.team.map((member) => member.attacker.variant_id)).toContain(
      "regular",
    );
    expect(trainer?.team[0].attacker.variant_id).toBe("mega-one");
    expect(trainer?.settings.dodgeSuccessRate).toBe(1);
    expect(trainer?.settings.relobbySeconds).toBe(0);
    expect(trainer?.settings.megaAllyBonus).toBe("none");
    expect(trainer?.actionDelaySeconds).toBe(0);
  });

  it("applies optimized teams back to their matching Trainer drafts", () => {
    const scores = [score("one"), score("two"), score("three")];
    const draft = createRaidPartyTrainerDraft(0, scores, settings);
    const trainer = buildRaidPartyTrainer(
      {
        ...draft,
        memberVariantIds: ["three", "one"],
      },
      scores,
      settings,
    );

    expect(trainer).not.toBeNull();
    expect(
      applyRaidPartyTrainersToDrafts([draft], [trainer!])[0].memberVariantIds,
    ).toEqual(["three", "one"]);
  });

  it("creates stable anonymous fingerprints that change with the scenario", () => {
    const scores = [score("one"), score("two")];
    const base = buildRaidPartyTrainer(
      {
        ...createRaidPartyTrainerDraft(0, scores, settings),
        memberVariantIds: ["one", "two"],
      },
      scores,
      settings,
    )!;
    const relabeled = { ...base, id: "other-id", label: "Other Trainer" };
    const delayed = { ...base, actionDelaySeconds: 0.5 };
    const differentPartyPowerTiming = {
      ...base,
      settings: {
        ...base.settings,
        partyPowerStrategy: "strongest-charged" as const,
      },
    };

    expect(getRaidPartyScenarioKey([base])).toBe(
      getRaidPartyScenarioKey([relabeled]),
    );
    expect(getRaidPartyScenarioKey([base])).not.toBe(
      getRaidPartyScenarioKey([delayed]),
    );
    expect(getRaidPartyScenarioKey([base])).not.toBe(
      getRaidPartyScenarioKey([differentPartyPowerTiming]),
    );
    expect(getRaidPartyScenarioKey([base])).toMatch(/^party-1-[a-f0-9]{8}$/);
  });
});

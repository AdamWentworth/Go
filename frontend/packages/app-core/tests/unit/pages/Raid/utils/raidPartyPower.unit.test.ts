import { describe, expect, it } from "vitest";

import {
  activatesPartyPowerWhenMeterFills,
  getPartyPowerStrategy,
  shouldActivatePartyPowerForChargedMove,
  type RaidCounterSettings,
} from "@/pages/Raid/utils/raidCalculations";

const settings = {
  attackerLevel: "50.0",
  friendship: "best",
  megaAllyBonus: "none",
  partyPower: "party4",
  dodgeStrategy: "none",
  weatherBoostedType: "",
  shadowBossMode: "normal",
  bossMovesetMode: "expected",
  relobbySeconds: 10,
} satisfies RaidCounterSettings;

describe("raid Party Power strategy", () => {
  it("preserves immediate activation as the default", () => {
    expect(getPartyPowerStrategy(settings)).toBe("immediate");
    expect(activatesPartyPowerWhenMeterFills(settings)).toBe(true);
  });

  it("uses next-charged only after the meter and move are both ready", () => {
    const nextCharged = {
      ...settings,
      partyPowerStrategy: "next-charged" as const,
    };

    expect(activatesPartyPowerWhenMeterFills(nextCharged)).toBe(false);
    expect(
      shouldActivatePartyPowerForChargedMove({
        settings: nextCharged,
        meterFull: true,
        chargedAvailable: true,
        currentChargedDamage: 50,
        strongestChargedDamage: 100,
      }),
    ).toBe(true);
    expect(
      shouldActivatePartyPowerForChargedMove({
        settings: nextCharged,
        meterFull: false,
        chargedAvailable: true,
        currentChargedDamage: 50,
        strongestChargedDamage: 100,
      }),
    ).toBe(false);
  });

  it("saves strongest-charged timing for the strongest team member", () => {
    const strongestCharged = {
      ...settings,
      partyPowerStrategy: "strongest-charged" as const,
    };
    const shouldActivate = (currentChargedDamage: number) =>
      shouldActivatePartyPowerForChargedMove({
        settings: strongestCharged,
        meterFull: true,
        chargedAvailable: true,
        currentChargedDamage,
        strongestChargedDamage: 100,
      });

    expect(shouldActivate(99)).toBe(false);
    expect(shouldActivate(100)).toBe(true);
  });

  it("never automatically spends Party Power in manual mode or without a party", () => {
    const manual = { ...settings, partyPowerStrategy: "manual" as const };
    const noParty = { ...settings, partyPower: "none" as const };
    const shouldActivate = (candidate: RaidCounterSettings) =>
      shouldActivatePartyPowerForChargedMove({
        settings: candidate,
        meterFull: true,
        chargedAvailable: true,
        currentChargedDamage: 100,
        strongestChargedDamage: 100,
      });

    expect(activatesPartyPowerWhenMeterFills(manual)).toBe(false);
    expect(shouldActivate(manual)).toBe(false);
    expect(shouldActivate(noParty)).toBe(false);
  });
});

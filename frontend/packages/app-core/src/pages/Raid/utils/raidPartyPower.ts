import type { PartyPowerStrategy, RaidCounterSettings } from "./raidTypes";

export const DEFAULT_PARTY_POWER_STRATEGY: PartyPowerStrategy = "immediate";

export const getPartyPowerStrategy = (
  settings: RaidCounterSettings,
): PartyPowerStrategy =>
  settings.partyPowerStrategy ?? DEFAULT_PARTY_POWER_STRATEGY;

export const activatesPartyPowerWhenMeterFills = (
  settings: RaidCounterSettings,
): boolean =>
  settings.partyPower !== "none" &&
  getPartyPowerStrategy(settings) === "immediate";

export const shouldActivatePartyPowerForChargedMove = ({
  settings,
  meterFull,
  chargedAvailable,
  currentChargedDamage,
  strongestChargedDamage,
}: {
  settings: RaidCounterSettings;
  meterFull: boolean;
  chargedAvailable: boolean;
  currentChargedDamage: number;
  strongestChargedDamage: number;
}): boolean => {
  if (!meterFull || !chargedAvailable || settings.partyPower === "none") {
    return false;
  }

  const strategy = getPartyPowerStrategy(settings);
  if (strategy === "next-charged") return true;
  if (strategy !== "strongest-charged") return false;

  return currentChargedDamage >= strongestChargedDamage - 0.001;
};

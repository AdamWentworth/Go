import type { RaidCounterScore } from "./raidTypes";

export const getRaidCounterSustainedDps = (
  score: RaidCounterScore,
): number => score.sustainedDps ?? score.dps;

export const compareRaidCounterScores = (
  a: RaidCounterScore,
  b: RaidCounterScore,
): number =>
  getRaidCounterSustainedDps(b) - getRaidCounterSustainedDps(a) ||
  b.dps - a.dps ||
  a.soloTimeSeconds - b.soloTimeSeconds ||
  a.faints - b.faints;

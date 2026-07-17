import type { RaidCounterScore } from "./raidTypes";
import { RAID_ATTACKER_TEAM_SIZE } from "./raidRules";

const compareCounterDps = (a: RaidCounterScore, b: RaidCounterScore): number =>
  b.dps - a.dps ||
  a.soloTimeSeconds - b.soloTimeSeconds ||
  a.variant.variant_id.localeCompare(b.variant.variant_id);

export const usesRaidMegaSlot = (score: RaidCounterScore): boolean => {
  if (score.variant.raidRoster?.formSource === "mega") return true;
  const variantType = (score.variant.variantType ?? "").toLowerCase();
  return (
    Boolean(score.variant.primal) ||
    variantType.includes("mega") ||
    variantType.includes("primal")
  );
};

const getRosterSlotKey = (score: RaidCounterScore): string => {
  const instanceId = score.variant.raidRoster?.instanceId;
  return instanceId
    ? `caught:${instanceId}`
    : `catalog:${score.variant.variant_id}`;
};

const selectRegularMembers = (
  scores: RaidCounterScore[],
  limit: number,
  excludedRosterSlot?: string,
): RaidCounterScore[] => {
  const selected: RaidCounterScore[] = [];
  const usedRosterSlots = new Set<string>();

  for (const score of scores) {
    if (selected.length >= limit) break;
    if (usesRaidMegaSlot(score)) continue;
    const rosterSlot = getRosterSlotKey(score);
    if (rosterSlot === excludedRosterSlot || usedRosterSlots.has(rosterSlot)) {
      continue;
    }
    usedRosterSlots.add(rosterSlot);
    selected.push(score);
  }

  return selected;
};

const sumTeamDps = (team: RaidCounterScore[]): number =>
  team.reduce((sum, member) => sum + member.dps, 0);

const compareTeams = (
  a: RaidCounterScore[],
  b: RaidCounterScore[],
): number =>
  sumTeamDps(b) - sumTeamDps(a) ||
  b.length - a.length ||
  a
    .map((member) => member.variant.variant_id)
    .join("|")
    .localeCompare(b.map((member) => member.variant.variant_id).join("|"));

export const selectLegalRaidTeamCounters = (
  scores: RaidCounterScore[],
  limit = RAID_ATTACKER_TEAM_SIZE,
): RaidCounterScore[] => {
  const teamSize = Math.max(1, Math.floor(limit));
  const sorted = [...scores].sort(compareCounterDps);
  const scenarios: RaidCounterScore[][] = [
    selectRegularMembers(sorted, teamSize),
  ];
  const seenMegaSlots = new Set<string>();

  for (const mega of sorted) {
    if (!usesRaidMegaSlot(mega)) continue;
    const rosterSlot = getRosterSlotKey(mega);
    if (seenMegaSlots.has(rosterSlot)) continue;
    seenMegaSlots.add(rosterSlot);
    scenarios.push([
      mega,
      ...selectRegularMembers(sorted, teamSize - 1, rosterSlot),
    ]);
  }

  return scenarios.sort(compareTeams)[0] ?? [];
};

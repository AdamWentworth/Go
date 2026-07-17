import { describe, expect, it } from "vitest";

import * as raidFacade from "@/pages/Raid/utils/raidCalculations";
import {
  calculateEffectiveRaidDps,
  calculateRaidBossCp,
} from "@/pages/Raid/utils/raidCombat";
import {
  getRaidTierKeyForVariant,
  isEligibleRaidAttacker,
} from "@/pages/Raid/utils/raidCatalog";
import {
  scoreBestRaidOverallAttackers,
  scoreRaidCounters,
} from "@/pages/Raid/utils/raidRankings";
import { simulateRaidBattle } from "@/pages/Raid/utils/raidSimulation";
import {
  RAID_ATTACKER_TEAM_SIZE,
  RAID_TIER_PRESETS,
} from "@/pages/Raid/utils/raidRules";

describe("raid calculation module boundaries", () => {
  it("keeps combat calculations available through the compatibility facade", () => {
    expect(raidFacade.calculateRaidBossCp).toBe(calculateRaidBossCp);
    expect(raidFacade.calculateEffectiveRaidDps).toBe(
      calculateEffectiveRaidDps,
    );
  });

  it("keeps catalog rules and configuration available through the facade", () => {
    expect(raidFacade.getRaidTierKeyForVariant).toBe(getRaidTierKeyForVariant);
    expect(raidFacade.isEligibleRaidAttacker).toBe(isEligibleRaidAttacker);
    expect(raidFacade.RAID_TIER_PRESETS).toBe(RAID_TIER_PRESETS);
    expect(raidFacade.RAID_ATTACKER_TEAM_SIZE).toBe(RAID_ATTACKER_TEAM_SIZE);
  });

  it("keeps ranking entry points available through the facade", () => {
    expect(raidFacade.scoreRaidCounters).toBe(scoreRaidCounters);
    expect(raidFacade.scoreBestRaidOverallAttackers).toBe(
      scoreBestRaidOverallAttackers,
    );
    expect(raidFacade.simulateRaidBattle).toBe(simulateRaidBattle);
  });
});

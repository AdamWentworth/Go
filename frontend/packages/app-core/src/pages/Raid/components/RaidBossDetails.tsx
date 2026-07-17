import type { RaidBoss } from "@/types/pokemonSubTypes";
import type {
  RaidBossStats,
  RaidGroupEstimate,
  RaidTierPreset,
} from "../utils/raidCalculations";
import { formatDps } from "../utils/raidViewModel";

interface RaidBossDetailsProps {
  tier: RaidTierPreset;
  bossStats: RaidBossStats;
  groupEstimate: RaidGroupEstimate;
  metadata: RaidBoss | null;
}

const RaidBossDetails = ({
  tier,
  bossStats,
  groupEstimate,
  metadata,
}: RaidBossDetailsProps) => (
  <>
    <section className="raid-category-card" aria-label="Raid category">
      <div>
        <span>Raid category</span>
        <strong>{tier.label}</strong>
      </div>
      <p>{tier.note}</p>
    </section>

    <section className="raid-boss-math">
      <div>
        <span>Boss CP</span>
        <strong>{bossStats.bossCp.toLocaleString()}</strong>
      </div>
      <div>
        <span>Boss HP</span>
        <strong>{bossStats.hp.toLocaleString()}</strong>
      </div>
      <div>
        <span>Tier</span>
        <strong>{tier.shortLabel}</strong>
      </div>
      <div>
        <span>Top team DPS</span>
        <strong>{formatDps(groupEstimate.topTeamDps)}</strong>
      </div>
      <div>
        <span>Min trainers</span>
        <strong>{groupEstimate.minTrainers || "-"}</strong>
      </div>
      <div>
        <span>Comfortable</span>
        <strong>{groupEstimate.comfortableTrainers || "-"}</strong>
      </div>
    </section>

    {metadata && (
      <section className="raid-catch-card">
        <div>
          <span>Known raid data</span>
          <strong>{metadata.tier}</strong>
        </div>
        <div>
          <span>Catch CP</span>
          <strong>
            {metadata.min_unboosted_cp} - {metadata.max_unboosted_cp}
          </strong>
        </div>
        <div>
          <span>Boosted CP</span>
          <strong>
            {metadata.min_boosted_cp} - {metadata.max_boosted_cp}
          </strong>
        </div>
      </section>
    )}
  </>
);

export default RaidBossDetails;

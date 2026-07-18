import type { RaidBoss } from "@/types/pokemonSubTypes";
import { FaCircleInfo } from "react-icons/fa6";
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

const formatTrainerCount = (count: number) => {
  if (!count) return "-";
  return `${count} trainer${count === 1 ? "" : "s"}`;
};

const RaidBossDetails = ({
  tier,
  bossStats,
  groupEstimate,
  metadata,
}: RaidBossDetailsProps) => (
  <section className="raid-boss-overview" aria-label="Raid summary">
    <header className="raid-boss-overview-header">
      <div>
        <span>{tier.label}</span>
        <p>{tier.note}</p>
      </div>
      <span className="raid-boss-hp">
        <strong>{bossStats.hp.toLocaleString()}</strong>
        <small>Boss HP</small>
      </span>
    </header>

    <dl className="raid-boss-overview-stats">
      <div className="primary">
        <dt>Minimum</dt>
        <dd>{formatTrainerCount(groupEstimate.minTrainers)}</dd>
      </div>
      <div>
        <dt>Comfortable</dt>
        <dd>{formatTrainerCount(groupEstimate.comfortableTrainers)}</dd>
      </div>
      <div>
        <dt>Team DPS</dt>
        <dd>{formatDps(groupEstimate.topTeamDps)}</dd>
      </div>
    </dl>

    <footer className="raid-boss-overview-footer">
      {groupEstimate.superMega && (
        <div className="raid-super-mega-requirement">
          <strong>{groupEstimate.superMega.shieldCount} shields</strong>
          <span>
            Plan for {groupEstimate.superMega.shieldCount} Trainers with a Mega
            Pokémon
            {groupEstimate.superMega.shieldCountSource === "fallback"
              ? " (estimated)"
              : ""}
          </span>
        </div>
      )}

      {metadata && (
        <div className="raid-catch-ranges" aria-label="Catch CP ranges">
          <span>
            Catch CP
            <strong>
              {metadata.min_unboosted_cp}–{metadata.max_unboosted_cp}
            </strong>
          </span>
          <span>
            Weather boosted
            <strong>
              {metadata.min_boosted_cp}–{metadata.max_boosted_cp}
            </strong>
          </span>
        </div>
      )}

      <details className="raid-estimate-rules">
        <summary>
          <FaCircleInfo aria-hidden="true" />
          Team estimate rules
        </summary>
        <p>
          Uses six distinct attackers and at most one Mega or Primal. One caught
          Pokémon cannot fill two form slots.
          {groupEstimate.superMega &&
            " Super Mega estimates assume every Trainer brings an actual Mega; Primal Pokémon cannot break shields."}
        </p>
      </details>
    </footer>
  </section>
);

export default RaidBossDetails;

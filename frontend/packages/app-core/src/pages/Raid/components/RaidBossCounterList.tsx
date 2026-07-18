import type {
  RaidCounterScore,
  RaidCounterSettings,
} from "../utils/raidCalculations";
import {
  formatDps,
  getMoveTypeIcon,
  getMoveTypeName,
  getRaidRosterDetail,
  getRaidVariantDisplayName,
} from "../utils/raidViewModel";
import { formatSeconds } from "../utils/raidCalculations";
import { getRaidCounterSustainedDps } from "../utils/raidCounterRanking";
import RaidPokemonImage from "./RaidPokemonImage";

interface RaidBossCounterListProps {
  scores: RaidCounterScore[];
  attackerLevel: RaidCounterSettings["attackerLevel"];
}

const formatOutcomeCount = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const formatOutcomeLabel = (value: number, singular: string): string =>
  `${formatOutcomeCount(value)} ${
    value === 1
      ? singular
      : singular.endsWith("y")
        ? `${singular.slice(0, -1)}ies`
        : `${singular}s`
  }`;

const getRankTier = (rank: number): "gold" | "silver" | "bronze" | "standard" => {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "standard";
};

const RaidBossCounterList = ({
  scores,
  attackerLevel,
}: RaidBossCounterListProps) => (
  <section className="raid-counter-list" aria-label="Raid counters">
    {scores.length > 0 ? (
      scores.map((score, index) => {
        const rank = index + 1;
        const rankTier = getRankTier(rank);
        const distribution = score.simulationDistribution;
        const medianTime =
          distribution?.timeToWinSeconds.p50 ?? score.soloTimeSeconds;
        const medianFaints = distribution?.faints.p50 ?? score.faints;
        const medianRelobbies =
          distribution?.relobbies.p50 ?? score.relobbies;
        const clearTimeDetail = distribution
          ? `Expected clear time ${formatSeconds(medianTime)}. Likely range ${formatSeconds(distribution.timeToWinSeconds.p10)} to ${formatSeconds(distribution.timeToWinSeconds.p90)}. Based on ${distribution.sampleCount} modeled outcomes.`
          : `Expected clear time ${formatSeconds(medianTime)}.`;
        const durabilityDetail = distribution
          ? `Expected ${formatOutcomeLabel(medianFaints, "faint")} and ${formatOutcomeLabel(medianRelobbies, "relobby")}. High estimate ${formatOutcomeLabel(distribution.faints.p90, "faint")} and ${formatOutcomeLabel(distribution.relobbies.p90, "relobby")}. Based on ${distribution.sampleCount} modeled outcomes.`
          : `Expected ${formatOutcomeLabel(medianFaints, "faint")} and ${formatOutcomeLabel(medianRelobbies, "relobby")}.`;
        const rosterDetail = getRaidRosterDetail(
          score.variant,
          attackerLevel,
        );

        return (
          <article
            className="raid-counter-card"
            key={`${score.variant.variant_id}-${index}`}
          >
            <div
              aria-label={
                rankTier === "standard"
                  ? `Rank ${rank}`
                  : `Rank ${rank}, ${rankTier} podium`
              }
              className={`raid-counter-rank raid-counter-rank--${rankTier}`}
            >
              {rank}
            </div>
            <RaidPokemonImage variant={score.variant} />
            <div className="raid-counter-main">
              <strong>{getRaidVariantDisplayName(score.variant)}</strong>
              <div className="raid-type-table-moves raid-counter-moves">
                {[score.fastMove, score.chargedMove].map((move, moveIndex) => {
                  const moveKind = moveIndex === 0 ? "Fast" : "Charged";
                  const typeName = getMoveTypeName(move);

                  return (
                    <span
                      aria-label={`${moveKind} move: ${move.name}, ${typeName} type`}
                      className="raid-type-table-move"
                      key={`${moveKind}-${move.name}`}
                    >
                      <img
                        alt={`${typeName} type`}
                        className="raid-type-table-move-icon"
                        draggable={false}
                        src={getMoveTypeIcon(move)}
                      />
                      <span className="raid-type-table-move-name">
                        {move.name}
                      </span>
                    </span>
                  );
                })}
              </div>
              <small>
                CP {score.cp.toLocaleString()}
                {rosterDetail
                  ? ` · ${rosterDetail}`
                  : ` at level ${attackerLevel.replace(".0", "")}`}
              </small>
            </div>
            <dl className="raid-counter-stats">
              <div className="raid-counter-stat">
                <dt>DPS</dt>
                <dd>{formatDps(getRaidCounterSustainedDps(score))} DPS</dd>
              </div>
              <div className="raid-counter-stat">
                <dt>Trainers</dt>
                <dd>
                  {score.trainersNeeded} trainer
                  {score.trainersNeeded === 1 ? "" : "s"}
                </dd>
              </div>
              <div
                aria-label={clearTimeDetail}
                className="raid-counter-stat"
                title={clearTimeDetail}
              >
                <dt>Clear</dt>
                <dd>{formatSeconds(medianTime)}</dd>
              </div>
              <div
                aria-label={durabilityDetail}
                className="raid-counter-stat"
                title={durabilityDetail}
              >
                <dt>Faints</dt>
                <dd>{formatOutcomeLabel(medianFaints, "faint")}</dd>
                {medianRelobbies > 0 && (
                  <small>{formatOutcomeLabel(medianRelobbies, "relobby")}</small>
                )}
              </div>
            </dl>
          </article>
        );
      })
    ) : (
      <div className="raid-list-empty">
        No counters match the current filters.
      </div>
    )}
  </section>
);

export default RaidBossCounterList;

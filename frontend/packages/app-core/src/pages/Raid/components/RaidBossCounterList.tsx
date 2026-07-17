import type { RaidCounterScore } from "../utils/raidCalculations";
import { formatDps, getRaidVariantDisplayName } from "../utils/raidViewModel";
import { formatSeconds } from "../utils/raidCalculations";
import RaidPokemonImage from "./RaidPokemonImage";

interface RaidBossCounterListProps {
  scores: RaidCounterScore[];
  attackerLevel: string;
}

const formatOutcomeCount = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const RaidBossCounterList = ({
  scores,
  attackerLevel,
}: RaidBossCounterListProps) => (
  <section className="raid-counter-list" aria-label="Raid counters">
    {scores.length > 0 ? (
      scores.map((score, index) => {
        const distribution = score.simulationDistribution;
        const medianTime =
          distribution?.timeToWinSeconds.p50 ?? score.soloTimeSeconds;
        const medianFaints = distribution?.faints.p50 ?? score.faints;

        return (
          <article
            className="raid-counter-card"
            key={`${score.variant.variant_id}-${index}`}
          >
            <div className="raid-counter-rank">{index + 1}</div>
            <RaidPokemonImage variant={score.variant} />
            <div className="raid-counter-main">
              <strong>{getRaidVariantDisplayName(score.variant)}</strong>
              <span>
                {score.fastMove.name} / {score.chargedMove.name}
              </span>
              <small>
                CP {score.cp.toLocaleString()} at level{" "}
                {attackerLevel.replace(".0", "")}
              </small>
            </div>
            <div className="raid-counter-stats">
              <span>{formatDps(score.dps)} DPS</span>
              <span>{score.trainersNeeded} trainers</span>
              <span>
                P50 {formatSeconds(medianTime)}
                {distribution && distribution.sampleCount > 1 && (
                  <small>
                    P10–P90 {formatSeconds(distribution.timeToWinSeconds.p10)}–
                    {formatSeconds(distribution.timeToWinSeconds.p90)}
                  </small>
                )}
              </span>
              <span>
                P50 {formatOutcomeCount(medianFaints)} faints
                {distribution && distribution.sampleCount > 1 ? (
                  <>
                    <small>
                      P90 {formatOutcomeCount(distribution.faints.p90)} faints ·{" "}
                      {formatOutcomeCount(distribution.relobbies.p90)} relobbies
                    </small>
                    <small>{distribution.sampleCount} modeled outcomes</small>
                  </>
                ) : score.relobbies > 0 ? (
                  <small>{formatOutcomeCount(score.relobbies)} relobbies</small>
                ) : null}
              </span>
            </div>
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

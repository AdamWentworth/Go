import type { RaidCounterScore } from "../utils/raidCalculations";
import { formatDps, getRaidVariantDisplayName } from "../utils/raidViewModel";
import { formatSeconds } from "../utils/raidCalculations";
import RaidPokemonImage from "./RaidPokemonImage";

interface RaidBossCounterListProps {
  scores: RaidCounterScore[];
  attackerLevel: string;
}

const RaidBossCounterList = ({
  scores,
  attackerLevel,
}: RaidBossCounterListProps) => (
  <section className="raid-counter-list" aria-label="Raid counters">
    {scores.length > 0 ? (
      scores.map((score, index) => (
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
            <span>{formatSeconds(score.soloTimeSeconds)}</span>
            <span>
              {score.faints.toFixed(1)} faints
              {score.relobbies > 0
                ? ` · ${score.relobbies.toFixed(1)} relobbies`
                : ""}
            </span>
          </div>
        </article>
      ))
    ) : (
      <div className="raid-list-empty">
        No counters match the current filters.
      </div>
    )}
  </section>
);

export default RaidBossCounterList;

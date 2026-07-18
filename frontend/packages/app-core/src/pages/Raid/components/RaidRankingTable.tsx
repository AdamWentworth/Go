import { useState, type ReactNode } from "react";
import {
  FaChevronDown,
  FaSort,
  FaSortDown,
  FaSortUp,
} from "react-icons/fa";
import RaidPokemonImage from "./RaidPokemonImage";
import {
  getVariantTypeNames,
  type RaidCounterSettings,
  type RaidOverallScore,
  type RaidTypeDpsScore,
} from "../utils/raidCalculations";
import {
  formatDps,
  formatEr,
  formatTypeList,
  formatWholeNumber,
  getMoveTypeIcon,
  getMoveTypeName,
  getRaidVariantDisplayName,
  getRaidRosterDetail,
  type RaidMetricSortDirection,
  type RaidMetricSortKey,
} from "../utils/raidViewModel";

type RaidRankingScore = RaidOverallScore | RaidTypeDpsScore;

interface RaidRankingTableProps {
  ariaLabel: string;
  scores: RaidRankingScore[];
  sortMetric: RaidMetricSortKey;
  sortDirection: RaidMetricSortDirection;
  onSort: (metric: RaidMetricSortKey) => void;
  emptyMessage: ReactNode;
  attackerLevel: RaidCounterSettings["attackerLevel"];
}

const isTypeDpsScore = (score: RaidRankingScore): score is RaidTypeDpsScore =>
  "fastMatchesType" in score;

const getRankTier = (rank: number) => {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "standard";
};

const metricLabels: Record<RaidMetricSortKey, string> = {
  eDps: "eDPS",
  dps: "DPS",
  tdo: "TDO",
  er: "ER",
  cp: "CP",
};

const formatMetricValue = (
  score: RaidRankingScore,
  metric: RaidMetricSortKey,
) => {
  switch (metric) {
    case "eDps":
      return formatDps(score.eDps);
    case "dps":
      return formatDps(score.dps);
    case "tdo":
      return formatWholeNumber(score.tdo);
    case "er":
      return formatEr(score.er);
    case "cp":
      return score.cp.toLocaleString();
  }
};

const RaidRankingTable = ({
  ariaLabel,
  scores,
  sortMetric,
  sortDirection,
  onSort,
  emptyMessage,
  attackerLevel,
}: RaidRankingTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpandedRow = (rowKey: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const renderSortableMetricHeader = (
    metric: RaidMetricSortKey,
    label: string,
    title?: string,
  ) => {
    const active = sortMetric === metric;
    const currentDirection = active ? sortDirection : "none";

    return (
      <th
        aria-sort={currentDirection}
        className="raid-sort-header"
        scope="col"
        title={title}
      >
        <button
          aria-label={`Sort by ${label}${
            active ? `, currently ${sortDirection}` : ""
          }`}
          onClick={() => onSort(metric)}
          type="button"
        >
          <span>{label}</span>
          {active ? (
            sortDirection === "descending" ? (
              <FaSortDown aria-hidden="true" />
            ) : (
              <FaSortUp aria-hidden="true" />
            )
          ) : (
            <FaSort aria-hidden="true" />
          )}
        </button>
      </th>
    );
  };

  const renderMove = (
    label: "Fast" | "Charged",
    score: RaidRankingScore,
    move: RaidRankingScore["fastMove"],
  ) => {
    const typeName = getMoveTypeName(move);
    const matchesType = isTypeDpsScore(score)
      ? label === "Fast"
        ? score.fastMatchesType
        : score.chargedMatchesType
      : false;

    return (
      <span
        aria-label={`${label} move: ${move.name}, ${typeName} type`}
        className={`raid-type-table-move ${matchesType ? "type-match" : ""}`}
      >
        <img
          className="raid-type-table-move-icon"
          src={getMoveTypeIcon(move)}
          alt={`${typeName} type`}
          draggable={false}
        />
        <span className="raid-type-table-move-name">{move.name}</span>
      </span>
    );
  };

  return (
    <section className="raid-type-results" aria-label={ariaLabel}>
      {scores.length > 0 ? (
        <table>
          <colgroup>
            <col className="raid-type-table-pokemon-column" />
            <col className="raid-type-table-moves-column" />
            <col span={5} className="raid-type-table-metric-column" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Pokémon</th>
              <th scope="col">Moves</th>
              {renderSortableMetricHeader(
                "eDps",
                "eDPS",
                "Effective damage per second after team relobby time",
              )}
              {renderSortableMetricHeader("dps", "DPS")}
              {renderSortableMetricHeader("tdo", "TDO")}
              {renderSortableMetricHeader("er", "ER")}
              {renderSortableMetricHeader("cp", "CP")}
            </tr>
          </thead>
          <tbody>
            {scores.map((score, index) => {
              const rosterDetail = getRaidRosterDetail(
                score.variant,
                attackerLevel,
              );
              const rank = index + 1;
              const rankTier = getRankTier(rank);
              const displayName = getRaidVariantDisplayName(score.variant);
              const rowKey = `${score.variant.variant_id}-${score.fastMove.name}-${score.chargedMove.name}-${index}`;
              const expanded = expandedRows.has(rowKey);
              return (
                <tr
                  className={expanded ? "raid-ranking-row--expanded" : undefined}
                  key={rowKey}
                >
                  <td>
                    <div className="raid-type-table-pokemon">
                      <span
                        aria-label={
                          rankTier === "standard"
                            ? `Rank ${rank}`
                            : `Rank ${rank}, ${rankTier} podium`
                        }
                        className={`raid-type-table-rank raid-type-table-rank--${rankTier}`}
                      >
                        {rank}
                      </span>
                      <RaidPokemonImage variant={score.variant} />
                      <span className="raid-type-table-pokemon-copy">
                        <strong>{displayName}</strong>
                        <small>
                          {formatTypeList(getVariantTypeNames(score.variant)) ||
                            "Unknown type"}
                        </small>
                        {rosterDetail && (
                          <small className="raid-roster-row-detail">
                            {rosterDetail}
                          </small>
                        )}
                      </span>
                    </div>
                    <button
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Hide" : "Show"} all raid stats for ${displayName}`}
                      className="raid-ranking-mobile-details-toggle"
                      onClick={() => toggleExpandedRow(rowKey)}
                      type="button"
                    >
                      <span className="raid-ranking-mobile-primary-metric">
                        <small>{metricLabels[sortMetric]}</small>
                        <strong>{formatMetricValue(score, sortMetric)}</strong>
                      </span>
                      <span className="raid-ranking-mobile-details-prompt">
                        {expanded ? "Hide extra stats" : "Tap for all stats"}
                        <FaChevronDown aria-hidden="true" />
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="raid-type-table-moves">
                      {renderMove("Fast", score, score.fastMove)}
                      {renderMove("Charged", score, score.chargedMove)}
                    </div>
                  </td>
                  <td
                    className="raid-type-table-number"
                    data-label="eDPS"
                  >
                    {formatDps(score.eDps)}
                  </td>
                  <td className="raid-type-table-number" data-label="DPS">
                    {formatDps(score.dps)}
                  </td>
                  <td className="raid-type-table-number" data-label="TDO">
                    {formatWholeNumber(score.tdo)}
                  </td>
                  <td className="raid-type-table-number" data-label="ER">
                    {formatEr(score.er)}
                  </td>
                  <td className="raid-type-table-number" data-label="CP">
                    {score.cp.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="raid-list-empty">{emptyMessage}</div>
      )}
    </section>
  );
};

export default RaidRankingTable;

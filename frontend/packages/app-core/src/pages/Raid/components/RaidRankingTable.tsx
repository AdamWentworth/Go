import type { ReactNode } from "react";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
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

const RaidRankingTable = ({
  ariaLabel,
  scores,
  sortMetric,
  sortDirection,
  onSort,
  emptyMessage,
  attackerLevel,
}: RaidRankingTableProps) => {
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
              return (
                <tr key={`${score.variant.variant_id}-${index}`}>
                <td>
                  <div className="raid-type-table-pokemon">
                    <span className="raid-type-table-rank">{index + 1}</span>
                    <RaidPokemonImage variant={score.variant} />
                    <span className="raid-type-table-pokemon-copy">
                      <strong>
                        {getRaidVariantDisplayName(score.variant)}
                      </strong>
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
                </td>
                <td>
                  <div className="raid-type-table-moves">
                    {renderMove("Fast", score, score.fastMove)}
                    {renderMove("Charged", score, score.chargedMove)}
                  </div>
                </td>
                <td className="raid-type-table-number">
                  {formatDps(score.eDps)}
                </td>
                <td className="raid-type-table-number">
                  {formatDps(score.dps)}
                </td>
                <td className="raid-type-table-number">
                  {formatWholeNumber(score.tdo)}
                </td>
                <td className="raid-type-table-number">{formatEr(score.er)}</td>
                <td className="raid-type-table-number">
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

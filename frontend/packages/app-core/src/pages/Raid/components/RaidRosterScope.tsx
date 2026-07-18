import { FaBookOpen, FaUser } from "react-icons/fa";
import type {
  RaidRosterScope as RaidRosterScopeValue,
  RaidRosterSummary,
} from "../utils/raidRoster";

type RaidRosterScopeProps = {
  scope: RaidRosterScopeValue;
  onChange: (scope: RaidRosterScopeValue) => void;
  isLoggedIn: boolean;
  loading: boolean;
  summary: RaidRosterSummary;
};

const RaidRosterScope = ({
  scope,
  onChange,
  isLoggedIn,
  loading,
  summary,
}: RaidRosterScopeProps) => {
  const rosterDetails = [
    `${summary.eligibleCount} raid-ready entries from ${summary.caughtCount} caught.`,
    "Uses each copy's current level, IVs, CP, and recorded moves.",
    summary.projectedFormCount > 0
      ? `${summary.projectedFormCount} available fusion, crowned, or Mega form entries included.`
      : "",
    summary.incompleteEntryCount > 0
      ? `${summary.incompleteEntryCount} caught entries need complete battle details before ranking.`
      : "",
    summary.hiddenPowerEstimatedCount > 0
      ? `${summary.hiddenPowerEstimatedCount} Hidden Power rolls use a marked type estimate.`
      : "",
    summary.unmappedCount > 0
      ? `${summary.unmappedCount} could not be matched to the current catalog.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="raid-roster-scope" aria-label="Raid attacker roster">
      <div className="raid-roster-segments" role="group" aria-label="Attacker source">
        <button
          className={scope === "catalog" ? "active" : ""}
          onClick={() => onChange("catalog")}
          type="button"
        >
          <FaBookOpen aria-hidden="true" />
          <span>All Pokémon</span>
        </button>
        <button
          aria-describedby={scope === "owned" ? "raid-roster-details" : undefined}
          aria-label="My Pokémon"
          className={scope === "owned" ? "active" : ""}
          disabled={!isLoggedIn}
          onClick={() => onChange("owned")}
          title={
            !isLoggedIn
              ? "Log in to rank your caught Pokémon"
              : scope === "owned" && !loading
                ? rosterDetails
                : undefined
          }
          type="button"
        >
          <FaUser aria-hidden="true" />
          <span>My Pokémon</span>
          {scope === "owned" && (
            <strong aria-hidden="true" className="raid-roster-count">
              {loading ? "…" : summary.eligibleCount}
            </strong>
          )}
        </button>
      </div>

      {scope === "owned" && (
        <span
          className="raid-roster-description"
          id="raid-roster-details"
          role="status"
        >
          {loading ? "Loading your raid roster" : rosterDetails}
        </span>
      )}
    </section>
  );
};

export default RaidRosterScope;

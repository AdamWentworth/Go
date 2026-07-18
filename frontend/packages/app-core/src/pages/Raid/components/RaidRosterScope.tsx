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
          className={scope === "owned" ? "active" : ""}
          disabled={!isLoggedIn}
          onClick={() => onChange("owned")}
          title={isLoggedIn ? undefined : "Log in to rank your caught Pokémon"}
          type="button"
        >
          <FaUser aria-hidden="true" />
          <span>My Pokémon</span>
        </button>
      </div>

      {scope === "owned" && (
        <div
          aria-label={loading ? "Loading your raid roster" : rosterDetails}
          className="raid-roster-status"
          role="status"
          title={loading ? undefined : rosterDetails}
        >
          <strong>
            {loading ? "Loading roster…" : `${summary.eligibleCount} raid-ready`}
          </strong>
        </div>
      )}
    </section>
  );
};

export default RaidRosterScope;

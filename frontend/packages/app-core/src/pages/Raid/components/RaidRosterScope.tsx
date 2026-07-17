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

      <div className="raid-roster-status" role="status">
        {scope === "catalog" ? (
          <>
            <strong>Catalog benchmark</strong>
            <span>Compares every released attacker at the selected level.</span>
          </>
        ) : loading ? (
          <>
            <strong>Loading your raid roster</strong>
            <span>Matching caught Pokémon to the battle catalog.</span>
          </>
        ) : (
          <>
            <strong>
              {summary.eligibleCount} raid-ready of {summary.caughtCount} caught
            </strong>
            <span>
              Uses each copy's current level, IVs, CP, and recorded moves.
              {summary.incompleteEntryCount > 0 &&
                ` ${summary.incompleteEntryCount} caught entries need complete battle details before ranking.`}
              {summary.hiddenPowerEstimatedCount > 0 &&
                ` ${summary.hiddenPowerEstimatedCount} Hidden Power rolls use a marked type estimate.`}
              {summary.unmappedCount > 0 &&
                ` ${summary.unmappedCount} could not be matched to the current catalog.`}
            </span>
          </>
        )}
      </div>
    </section>
  );
};

export default RaidRosterScope;

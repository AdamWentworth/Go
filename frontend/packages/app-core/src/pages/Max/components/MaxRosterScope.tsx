import { FaBookOpen, FaUser } from 'react-icons/fa';

import type {
  MaxRosterScope as MaxRosterScopeValue,
  MaxRosterSummary,
} from '../utils/maxRoster';

type MaxRosterScopeProps = {
  scope: MaxRosterScopeValue;
  onChange: (scope: MaxRosterScopeValue) => void;
  isLoggedIn: boolean;
  loading: boolean;
  summary: MaxRosterSummary;
};

const MaxRosterScope = ({
  scope,
  onChange,
  isLoggedIn,
  loading,
  summary,
}: MaxRosterScopeProps) => {
  const details = [
    `${summary.eligibleCount} Max-ready entries from ${summary.caughtCount} caught Max Pokémon.`,
    "Uses each copy's recorded level, IVs, Fast Move, and Max Move levels.",
    summary.incompleteEntryCount > 0
      ? `${summary.incompleteEntryCount} need complete battle details before ranking.`
      : '',
    summary.unmappedCount > 0
      ? `${summary.unmappedCount} could not be matched to the current catalog.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="max-roster-scope" aria-label="Max Battle roster">
      <div className="max-roster-segments" role="group" aria-label="Max Pokémon source">
        <button
          aria-pressed={scope === 'catalog'}
          className={scope === 'catalog' ? 'active' : ''}
          onClick={() => onChange('catalog')}
          type="button"
        >
          <FaBookOpen aria-hidden="true" />
          <span>All Pokémon</span>
        </button>
        <button
          aria-describedby={scope === 'owned' ? 'max-roster-details' : undefined}
          aria-label="My Pokémon"
          aria-pressed={scope === 'owned'}
          className={scope === 'owned' ? 'active' : ''}
          disabled={!isLoggedIn}
          onClick={() => onChange('owned')}
          title={!isLoggedIn ? 'Log in to rank your caught Max Pokémon' : details}
          type="button"
        >
          <FaUser aria-hidden="true" />
          <span>My Pokémon</span>
          {scope === 'owned' && (
            <strong aria-hidden="true" className="max-roster-count">
              {loading ? '…' : summary.eligibleCount}
            </strong>
          )}
        </button>
      </div>
      {scope === 'owned' && (
        <span className="max-roster-description" id="max-roster-details" role="status">
          {loading ? 'Loading your Max roster' : details}
        </span>
      )}
    </section>
  );
};

export default MaxRosterScope;

import { FaChevronDown, FaChevronUp, FaSlidersH } from "react-icons/fa";

interface RaidCounterToolbarProps {
  label: string;
  search: string;
  onSearchChange: (search: string) => void;
  bestOnly: boolean;
  onBestOnlyChange: (bestOnly: boolean) => void;
  includeRankingSettings?: boolean;
  rankingSettingsOpen?: boolean;
  onRankingSettingsOpenChange?: (open: boolean) => void;
  bestOnlyLabel?: string;
  allMovesLabel?: string;
}

const RaidCounterToolbar = ({
  label,
  search,
  onSearchChange,
  bestOnly,
  onBestOnlyChange,
  includeRankingSettings = false,
  rankingSettingsOpen = false,
  onRankingSettingsOpenChange,
  bestOnlyLabel = "Best moves",
  allMovesLabel = "All moves",
}: RaidCounterToolbarProps) => (
  <section className="raid-counter-toolbar">
    <label className="raid-field">
      <span>{label}</span>
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Pokemon, type, or move"
      />
    </label>
    <div className="raid-counter-actions">
      <button
        className={`raid-toggle-button ${bestOnly ? "active" : ""}`}
        onClick={() => onBestOnlyChange(!bestOnly)}
        type="button"
      >
        {bestOnly ? bestOnlyLabel : allMovesLabel}
      </button>
      {includeRankingSettings && (
        <button
          aria-expanded={rankingSettingsOpen}
          className="raid-ranking-settings-toggle"
          onClick={() => onRankingSettingsOpenChange?.(!rankingSettingsOpen)}
          type="button"
        >
          <FaSlidersH aria-hidden="true" />
          <span>Settings</span>
          {rankingSettingsOpen ? (
            <FaChevronUp aria-hidden="true" />
          ) : (
            <FaChevronDown aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  </section>
);

export default RaidCounterToolbar;

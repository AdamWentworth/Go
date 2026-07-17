import type { RaidViewMode } from "../utils/raidViewModel";

interface RaidModeTabsProps {
  viewMode: RaidViewMode;
  onChange: (viewMode: RaidViewMode) => void;
}

const RAID_VIEWS: Array<{ label: string; value: RaidViewMode }> = [
  { label: "Attacker rankings", value: "rankings" },
  { label: "Boss counters", value: "boss" },
];

const RaidModeTabs = ({ viewMode, onChange }: RaidModeTabsProps) => (
  <section className="raid-mode-tabs" aria-label="Raid planner views">
    {RAID_VIEWS.map((view) => (
      <button
        className={viewMode === view.value ? "active" : ""}
        key={view.value}
        onClick={() => onChange(view.value)}
        type="button"
      >
        {view.label}
      </button>
    ))}
  </section>
);

export default RaidModeTabs;

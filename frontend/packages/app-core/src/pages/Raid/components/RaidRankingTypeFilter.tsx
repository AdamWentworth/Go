import { getTypeIconPath } from "@/utils/imageHelpers";
import { capitalize, getTypeClassName } from "../utils/raidViewModel";

interface RaidRankingTypeFilterProps {
  selectedType: string;
  typeOptions: string[];
  onChange: (type: string) => void;
}

const RaidRankingTypeFilter = ({
  selectedType,
  typeOptions,
  onChange,
}: RaidRankingTypeFilterProps) => (
  <section
    className="raid-ranking-type-filter"
    aria-label="Attacker type filter"
  >
    <button
      aria-label="All types"
      aria-pressed={selectedType === ""}
      className={`raid-ranking-all ${selectedType === "" ? "active" : ""}`}
      onClick={() => onChange("")}
      title="Show overall rankings"
      type="button"
    >
      All types
    </button>
    <div className="raid-ranking-type-options">
      {typeOptions.map((type) => (
        <button
          aria-label={capitalize(type)}
          aria-pressed={selectedType === type}
          className={`${getTypeClassName(type)} ${selectedType === type ? "active" : ""}`}
          key={type}
          onClick={() => onChange(type)}
          title={capitalize(type)}
          type="button"
        >
          <img src={getTypeIconPath(type)} alt="" draggable={false} />
          <span>{capitalize(type)}</span>
        </button>
      ))}
    </div>
  </section>
);

export default RaidRankingTypeFilter;

import { FaGlobeAmericas } from "react-icons/fa";
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
    <span className="raid-ranking-type-filter-label">Ranking scope</span>
    <div className="raid-ranking-type-options">
      <button
        aria-label="Overall"
        aria-pressed={selectedType === ""}
        className={`raid-ranking-overall ${selectedType === "" ? "active" : ""}`}
        onClick={() => onChange("")}
        title="Overall"
        type="button"
      >
        <FaGlobeAmericas aria-hidden="true" />
        <span>Overall</span>
      </button>
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

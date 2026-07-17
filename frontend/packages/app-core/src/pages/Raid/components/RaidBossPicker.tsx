import type { KeyboardEvent } from "react";
import type { PokemonVariant } from "@/types/pokemonVariants";
import RaidPokemonImage from "./RaidPokemonImage";
import { getVariantTypeNames } from "../utils/raidCalculations";
import {
  formatTypeList,
  getRaidVariantDisplayName,
  getVariantBadge,
} from "../utils/raidViewModel";

interface RaidBossPickerProps {
  selectedBoss: PokemonVariant;
  bossCp: number;
  search: string;
  searchActive: boolean;
  filteredBossOptions: PokemonVariant[];
  onSearchChange: (search: string) => void;
  onBossSelect: (boss: PokemonVariant) => void;
}

const RaidBossPicker = ({
  selectedBoss,
  bossCp,
  search,
  searchActive,
  filteredBossOptions,
  onSearchChange,
  onBossSelect,
}: RaidBossPickerProps) => {
  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && filteredBossOptions[0]) {
      onBossSelect(filteredBossOptions[0]);
    }
  };

  return (
    <aside className="raid-panel raid-boss-panel">
      <div className="raid-panel-header">
        <p className="raid-eyebrow">Raid boss</p>
        <h2>{getRaidVariantDisplayName(selectedBoss)}</h2>
      </div>

      <div className="raid-boss-card">
        <div className="raid-boss-image-shell">
          <RaidPokemonImage
            variant={selectedBoss}
            alt={getRaidVariantDisplayName(selectedBoss)}
          />
        </div>
        <div className="raid-boss-summary">
          <span>{getVariantBadge(selectedBoss)}</span>
          <strong>CP {bossCp.toLocaleString()}</strong>
          <small>
            {formatTypeList(getVariantTypeNames(selectedBoss)) ||
              "Unknown type"}
          </small>
        </div>
      </div>

      <label className="raid-field">
        <span>Find boss</span>
        <input
          type="search"
          value={search}
          autoComplete="off"
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search by name or number"
        />
      </label>

      {searchActive && (
        <div
          className="raid-boss-suggestions"
          aria-label="Raid boss suggestions"
        >
          {filteredBossOptions.length > 0 ? (
            filteredBossOptions.map((boss) => (
              <button
                className={`raid-boss-option ${
                  boss.variant_id === selectedBoss.variant_id ? "active" : ""
                }`}
                key={boss.variant_id}
                onClick={() => onBossSelect(boss)}
                type="button"
              >
                <RaidPokemonImage variant={boss} />
                <span>{getRaidVariantDisplayName(boss)}</span>
                <small>#{String(boss.pokedex_number).padStart(4, "0")}</small>
              </button>
            ))
          ) : (
            <p className="raid-boss-empty">No matching raid boss found.</p>
          )}
        </div>
      )}
    </aside>
  );
};

export default RaidBossPicker;

import {
  getStorageString,
  STORAGE_KEYS,
} from "@/utils/storage";
import { RAID_SIMULATION_MODEL_VERSION } from "../utils/raidRules";

const RAID_RANKING_METHODOLOGY_URL =
  "https://github.com/AdamWentworth/PokeGoNexus/blob/master/docs/raid-ranking-methodology.md";

const compactVersion = (version: string | null): string => {
  if (!version) return "pending";
  return version.length > 12 ? `${version.slice(0, 12)}…` : version;
};

const RaidModelProvenance = () => {
  const catalogVersion = getStorageString(
    STORAGE_KEYS.pokemonCatalogVersion,
  );
  const movesVersion = getStorageString(STORAGE_KEYS.pokemonMovesVersion);
  const raidDataVersion = getStorageString(
    STORAGE_KEYS.pokemonRaidDataVersion,
  );
  const versionDetails = [
    `Catalog: ${catalogVersion ?? "pending"}`,
    `Moves: ${movesVersion ?? "pending"}`,
    `Raid data: ${raidDataVersion ?? "pending"}`,
  ].join("\n");

  return (
    <div className="raid-model-provenance" aria-label="Raid ranking versions">
      <span>Model v{RAID_SIMULATION_MODEL_VERSION}</span>
      <span title={versionDetails}>Catalog {compactVersion(catalogVersion)}</span>
      <a
        href={RAID_RANKING_METHODOLOGY_URL}
        target="_blank"
        rel="noreferrer"
      >
        How rankings work
      </a>
    </div>
  );
};

export default RaidModelProvenance;

import { FaCircleInfo } from "react-icons/fa6";
import {
  getStorageString,
  STORAGE_KEYS,
} from "@/utils/storage";
import { RAID_SIMULATION_MODEL_VERSION } from "../utils/raidRules";

const RAID_RANKING_METHODOLOGY_URL =
  "https://github.com/AdamWentworth/PokeGoNexus/blob/master/docs/raid-ranking-methodology.md";

const RaidModelProvenance = () => {
  const catalogVersion = getStorageString(
    STORAGE_KEYS.pokemonCatalogVersion,
  );
  const movesVersion = getStorageString(STORAGE_KEYS.pokemonMovesVersion);
  const raidDataVersion = getStorageString(
    STORAGE_KEYS.pokemonRaidDataVersion,
  );
  const versionDetails = [
    `Model: v${RAID_SIMULATION_MODEL_VERSION}`,
    `Catalog: ${catalogVersion ?? "pending"}`,
    `Moves: ${movesVersion ?? "pending"}`,
    `Raid data: ${raidDataVersion ?? "pending"}`,
  ].join("\n");

  return (
    <a
      aria-label="Ranking method"
      className="raid-model-provenance"
      href={RAID_RANKING_METHODOLOGY_URL}
      target="_blank"
      rel="noreferrer"
      title={versionDetails}
    >
      <FaCircleInfo aria-hidden="true" />
      <span>Method</span>
    </a>
  );
};

export default RaidModelProvenance;

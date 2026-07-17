import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  RaidPartySimulationResult,
  RaidPartyTrainer,
  RaidTierPreset,
} from "./raidTypes";

export type RaidPartyWorkerRequest = {
  trainers: RaidPartyTrainer[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
};

export type RaidPartyWorkerResponse =
  | { result: RaidPartySimulationResult | null }
  | { error: string };

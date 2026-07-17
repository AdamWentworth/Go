import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidTierPreset,
} from "./raidTypes";

export interface RaidCounterWorkerRequest {
  finalists: PokemonVariant[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  bestOnly: boolean;
}

export type RaidCounterWorkerResponse =
  | { scores: RaidCounterScore[]; error?: never }
  | { scores?: never; error: string };

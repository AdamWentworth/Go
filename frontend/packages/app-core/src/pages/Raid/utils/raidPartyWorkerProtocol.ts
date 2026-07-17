import type { PokemonVariant } from "@/types/pokemonVariants";
import type {
  RaidCounterScore,
  RaidPartyOptimizationResult,
  RaidPartySimulationResult,
  RaidPartyTrainer,
  RaidTierPreset,
} from "./raidTypes";

type RaidPartyWorkerBaseRequest = {
  trainers: RaidPartyTrainer[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
};

export type RaidPartyWorkerRequest =
  | (RaidPartyWorkerBaseRequest & { kind: "simulate" })
  | (RaidPartyWorkerBaseRequest & {
      kind: "optimize";
      scores: RaidCounterScore[];
    });

export type RaidPartyWorkerResponse =
  | { kind: "simulation"; result: RaidPartySimulationResult | null }
  | { kind: "optimization"; result: RaidPartyOptimizationResult | null }
  | { error: string };

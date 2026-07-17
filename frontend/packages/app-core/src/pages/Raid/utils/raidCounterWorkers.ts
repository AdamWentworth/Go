import type { PokemonVariant } from "@/types/pokemonVariants";
import {
  dedupeBestCounterPerVariant,
  scoreRaidCounterFinalists,
  selectRaidCounterFinalists,
} from "./raidRankings";
import { getLegalRaidChargedMoves, getLegalRaidFastMoves } from "./raidCatalog";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidTierPreset,
} from "./raidTypes";
import type {
  RaidCounterWorkerRequest,
  RaidCounterWorkerResponse,
} from "./raidCounterWorkerProtocol";

type WeightedFinalistChunk = {
  finalists: PokemonVariant[];
  weight: number;
};

const compareRaidCounterScores = (
  a: RaidCounterScore,
  b: RaidCounterScore,
) =>
  b.dps - a.dps ||
  a.soloTimeSeconds - b.soloTimeSeconds ||
  a.faints - b.faints;

const getFinalistWeight = (variant: PokemonVariant): number =>
  Math.max(
    1,
    getLegalRaidFastMoves(variant).length *
      getLegalRaidChargedMoves(variant).length,
  );

export const buildRaidCounterWorkerChunks = (
  finalists: PokemonVariant[],
  workerCount: number,
): PokemonVariant[][] => {
  const chunks: WeightedFinalistChunk[] = Array.from(
    { length: Math.max(1, workerCount) },
    () => ({ finalists: [], weight: 0 }),
  );

  [...finalists]
    .sort((a, b) => getFinalistWeight(b) - getFinalistWeight(a))
    .forEach((finalist) => {
      const lightest = chunks.reduce((selected, chunk) =>
        chunk.weight < selected.weight ? chunk : selected,
      );
      const weight = getFinalistWeight(finalist);
      lightest.finalists.push(finalist);
      lightest.weight += weight;
    });

  return chunks
    .map((chunk) => chunk.finalists)
    .filter((chunk) => chunk.length > 0);
};

const getWorkerCount = (finalistCount: number): number => {
  const hardwareThreads =
    typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency || 2;
  return Math.max(
    1,
    Math.min(4, finalistCount, Math.max(1, hardwareThreads - 1)),
  );
};

const runWorker = (
  request: RaidCounterWorkerRequest,
  signal?: AbortSignal,
): Promise<RaidCounterScore[]> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/raidCounter.worker.ts", import.meta.url),
      { type: "module" },
    );

    const finish = () => {
      signal?.removeEventListener("abort", handleAbort);
      worker.terminate();
    };
    const handleAbort = () => {
      finish();
      reject(new DOMException("Raid calculation cancelled", "AbortError"));
    };

    worker.onmessage = (event: MessageEvent<RaidCounterWorkerResponse>) => {
      finish();
      if ("error" in event.data) {
        reject(new Error(event.data.error));
        return;
      }
      resolve(event.data.scores);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || "Raid calculation worker failed"));
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    worker.postMessage(request);
  });

export const scoreRaidCountersAsync = async (
  attackers: PokemonVariant[],
  boss: PokemonVariant,
  tier: RaidTierPreset,
  settings: RaidCounterSettings,
  bestOnly: boolean,
  signal?: AbortSignal,
): Promise<RaidCounterScore[]> => {
  const finalists = selectRaidCounterFinalists(
    attackers,
    boss,
    tier,
    settings,
  );
  if (finalists.length === 0) return [];

  if (typeof Worker !== "function") {
    const scores = scoreRaidCounterFinalists(
      finalists,
      boss,
      tier,
      settings,
    );
    return bestOnly ? dedupeBestCounterPerVariant(scores) : scores;
  }

  const chunks = buildRaidCounterWorkerChunks(
    finalists,
    getWorkerCount(finalists.length),
  );
  const results = await Promise.all(
    chunks.map((chunk) =>
      runWorker(
        { finalists: chunk, boss, tier, settings, bestOnly },
        signal,
      ),
    ),
  );

  return results.flat().sort(compareRaidCounterScores);
};

/// <reference lib="webworker" />

import {
  dedupeBestCounterPerVariant,
  scoreRaidCounterFinalists,
} from "../utils/raidRankings";
import type {
  RaidCounterWorkerRequest,
  RaidCounterWorkerResponse,
} from "../utils/raidCounterWorkerProtocol";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<RaidCounterWorkerRequest>) => {
  try {
    const { finalists, boss, tier, settings, bestOnly } = event.data;
    const scores = scoreRaidCounterFinalists(
      finalists,
      boss,
      tier,
      settings,
    );
    const response: RaidCounterWorkerResponse = {
      scores: bestOnly ? dedupeBestCounterPerVariant(scores) : scores,
    };
    workerScope.postMessage(response);
  } catch (error) {
    const response: RaidCounterWorkerResponse = {
      error: error instanceof Error ? error.message : String(error),
    };
    workerScope.postMessage(response);
  }
};

export {};

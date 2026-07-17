/// <reference lib="webworker" />

import { simulateHeterogeneousRaidPartyAcrossBossMovesets } from "../utils/raidPartySimulation";
import { optimizeRaidParty } from "../utils/raidPartyOptimizer";
import type {
  RaidPartyWorkerRequest,
  RaidPartyWorkerResponse,
} from "../utils/raidPartyWorkerProtocol";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<RaidPartyWorkerRequest>) => {
  try {
    if (event.data.kind === "optimize") {
      workerScope.postMessage({
        kind: "optimization",
        result: optimizeRaidParty(event.data),
      } satisfies RaidPartyWorkerResponse);
      return;
    }
    workerScope.postMessage({
      kind: "simulation",
      result: simulateHeterogeneousRaidPartyAcrossBossMovesets(event.data),
    } satisfies RaidPartyWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
    } satisfies RaidPartyWorkerResponse);
  }
};

export {};

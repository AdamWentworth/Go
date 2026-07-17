/// <reference lib="webworker" />

import { simulateHeterogeneousRaidPartyAcrossBossMovesets } from "../utils/raidPartySimulation";
import type {
  RaidPartyWorkerRequest,
  RaidPartyWorkerResponse,
} from "../utils/raidPartyWorkerProtocol";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<RaidPartyWorkerRequest>) => {
  try {
    workerScope.postMessage({
      result: simulateHeterogeneousRaidPartyAcrossBossMovesets(event.data),
    } satisfies RaidPartyWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
    } satisfies RaidPartyWorkerResponse);
  }
};

export {};

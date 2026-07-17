import { simulateHeterogeneousRaidPartyAcrossBossMovesets } from "./raidPartySimulation";
import type {
  RaidPartyWorkerRequest,
  RaidPartyWorkerResponse,
} from "./raidPartyWorkerProtocol";
import type { RaidPartySimulationResult } from "./raidTypes";

export const simulateRaidPartyAsync = (
  request: RaidPartyWorkerRequest,
  signal?: AbortSignal,
): Promise<RaidPartySimulationResult | null> => {
  if (typeof Worker !== "function") {
    return Promise.resolve(
      simulateHeterogeneousRaidPartyAcrossBossMovesets(request),
    );
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("../workers/raidParty.worker.ts", import.meta.url),
      { type: "module" },
    );
    const finish = () => {
      signal?.removeEventListener("abort", handleAbort);
      worker.terminate();
    };
    const handleAbort = () => {
      finish();
      reject(new DOMException("Raid party simulation cancelled", "AbortError"));
    };

    worker.onmessage = (event: MessageEvent<RaidPartyWorkerResponse>) => {
      finish();
      if ("error" in event.data) {
        reject(new Error(event.data.error));
        return;
      }
      resolve(event.data.result);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || "Raid party simulation failed"));
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    worker.postMessage(request);
  });
};

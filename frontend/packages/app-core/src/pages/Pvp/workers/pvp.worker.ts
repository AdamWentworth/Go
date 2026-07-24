/// <reference lib="webworker" />

import {
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
} from '../utils/pvpLocalRosterEvaluation';
import type {
  PvPWorkerRequest,
  PvPWorkerResponse,
} from '../utils/pvpWorkerProtocol';

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<PvPWorkerRequest>) => {
  try {
    if (event.data.kind === 'battle') {
      workerScope.postMessage({
        kind: 'battle',
        response: simulatePvPBattleLocally(event.data.request),
      } satisfies PvPWorkerResponse);
      return;
    }
    workerScope.postMessage({
      kind: 'evaluation',
      response: evaluatePvPRosterLocally(event.data),
    } satisfies PvPWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
    } satisfies PvPWorkerResponse);
  }
};

export {};

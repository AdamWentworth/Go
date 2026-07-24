/// <reference lib="webworker" />

import { evaluatePvPRosterLocally } from '../utils/pvpLocalRosterEvaluation';
import type {
  PvPRosterWorkerRequest,
  PvPRosterWorkerResponse,
} from '../utils/pvpRosterWorkerProtocol';

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<PvPRosterWorkerRequest>) => {
  try {
    workerScope.postMessage({
      kind: 'evaluation',
      response: evaluatePvPRosterLocally(event.data),
    } satisfies PvPRosterWorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
    } satisfies PvPRosterWorkerResponse);
  }
};

export {};

import type { PokemonPvPRosterEvaluationResponse } from '@shared-contracts/pokemon';

import { evaluatePvPRosterLocally } from './pvpLocalRosterEvaluation';
import type {
  PvPRosterWorkerRequest,
  PvPRosterWorkerResponse,
} from './pvpRosterWorkerProtocol';

export const evaluatePvPRosterAsync = (
  request: PvPRosterWorkerRequest,
  signal?: AbortSignal,
): Promise<PokemonPvPRosterEvaluationResponse> => {
  if (typeof Worker !== 'function') {
    return Promise.resolve(evaluatePvPRosterLocally(request));
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/pvpRoster.worker.ts', import.meta.url),
      { type: 'module' },
    );
    const finish = () => {
      signal?.removeEventListener('abort', handleAbort);
      worker.terminate();
    };
    const handleAbort = () => {
      finish();
      reject(new DOMException('Personal PvP evaluation cancelled', 'AbortError'));
    };

    worker.onmessage = (event: MessageEvent<PvPRosterWorkerResponse>) => {
      finish();
      if ('error' in event.data) {
        reject(new Error(event.data.error));
        return;
      }
      if (event.data.kind !== 'evaluation') {
        reject(new Error('Personal PvP worker returned an unexpected result'));
        return;
      }
      resolve(event.data.response);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'Personal PvP evaluation failed'));
    };
    signal?.addEventListener('abort', handleAbort, { once: true });
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    worker.postMessage(request);
  });
};

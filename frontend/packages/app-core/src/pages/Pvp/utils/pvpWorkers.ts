import type {
  PokemonPvPBattleRequest,
  PokemonPvPBattleResponse,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import {
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
} from './pvpLocalRosterEvaluation';
import type {
  PvPWorkerRequest,
  PvPWorkerResponse,
  PvPRosterWorkerRequest,
} from './pvpWorkerProtocol';

const runPvPWorker = (
  request: PvPWorkerRequest,
  signal?: AbortSignal,
): Promise<PvPWorkerResponse> => {
  if (typeof Worker !== 'function') {
    return Promise.resolve(
      request.kind === 'battle'
        ? {
          kind: 'battle',
          response: simulatePvPBattleLocally(request.request),
        }
        : {
          kind: 'evaluation',
          response: evaluatePvPRosterLocally(request),
        },
    );
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/pvp.worker.ts', import.meta.url),
      { type: 'module' },
    );
    const finish = () => {
      signal?.removeEventListener('abort', handleAbort);
      worker.terminate();
    };
    const handleAbort = () => {
      finish();
      reject(new DOMException('Local PvP calculation cancelled', 'AbortError'));
    };

    worker.onmessage = (event: MessageEvent<PvPWorkerResponse>) => {
      finish();
      if ('error' in event.data) {
        reject(new Error(event.data.error));
        return;
      }
      resolve(event.data);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'Local PvP calculation failed'));
    };
    signal?.addEventListener('abort', handleAbort, { once: true });
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    worker.postMessage(request);
  });
};

export const evaluatePvPRosterAsync = async (
  request: PvPRosterWorkerRequest,
  signal?: AbortSignal,
): Promise<PokemonPvPRosterEvaluationResponse> => {
  const result = await runPvPWorker(request, signal);
  if ('error' in result || result.kind !== 'evaluation') {
    throw new Error('Personal PvP worker returned an unexpected result');
  }
  return result.response;
};

export const simulatePvPBattleAsync = async (
  request: PokemonPvPBattleRequest,
  signal?: AbortSignal,
): Promise<PokemonPvPBattleResponse> => {
  const result = await runPvPWorker({ kind: 'battle', request }, signal);
  if ('error' in result || result.kind !== 'battle') {
    throw new Error('Battle Lab worker returned an unexpected result');
  }
  return result.response;
};

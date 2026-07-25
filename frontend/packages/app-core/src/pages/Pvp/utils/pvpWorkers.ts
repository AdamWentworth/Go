import type {
  PokemonPvPBattleRequest,
  PokemonPvPBattleResponse,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import {
  evaluatePvPTeamLocally,
  evaluatePvPRosterLocally,
  simulatePvPBattleLocally,
  simulatePvPTeamBattleLocally,
} from './pvpLocalRosterEvaluation';
import type {
  PvPWorkerRequest,
  PvPWorkerResponse,
  PvPRosterWorkerRequest,
  PvPTeamEvaluationResponse,
  PvPTeamBattleRequest,
  PvPTeamBattleResponse,
  PvPTeamWorkerRequest,
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
        : request.kind === 'team'
          ? {
            kind: 'team',
            response: evaluatePvPTeamLocally(request),
          }
          : request.kind === 'team-battle'
            ? {
              kind: 'team-battle',
              response: simulatePvPTeamBattleLocally(request),
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

export const evaluatePvPTeamAsync = async (
  request: PvPTeamWorkerRequest,
  signal?: AbortSignal,
): Promise<PvPTeamEvaluationResponse> => {
  const result = await runPvPWorker(request, signal);
  if ('error' in result || result.kind !== 'team') {
    throw new Error('PvP team worker returned an unexpected result');
  }
  return result.response;
};

export const simulatePvPTeamBattleAsync = async (
  request: PvPTeamBattleRequest,
  signal?: AbortSignal,
): Promise<PvPTeamBattleResponse> => {
  const result = await runPvPWorker(request, signal);
  if ('error' in result || result.kind !== 'team-battle') {
    throw new Error('Team Battle Lab worker returned an unexpected result');
  }
  return result.response;
};

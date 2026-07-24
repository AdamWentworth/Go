import type {
  PokemonPvPBattleFighter,
  PokemonPvPBattleRequest,
  PokemonPvPBattleResponse,
  PokemonPvPRosterEvaluationOpponent,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

export type PvPRosterEvaluationCandidate = {
  fighter: PokemonPvPBattleFighter;
  referenceFighter: PokemonPvPBattleFighter;
  sourceScore: number;
  sourceCategoryScores: number[];
};

export type PvPRosterWorkerRequest = {
  kind: 'evaluate';
  candidates: PvPRosterEvaluationCandidate[];
  opponents: PokemonPvPRosterEvaluationOpponent[];
};

export type PvPBattleWorkerRequest = {
  kind: 'battle';
  request: PokemonPvPBattleRequest;
};

export type PvPWorkerRequest = PvPRosterWorkerRequest | PvPBattleWorkerRequest;

export type PvPWorkerResponse =
  | {
    kind: 'evaluation';
    response: PokemonPvPRosterEvaluationResponse;
  }
  | {
    kind: 'battle';
    response: PokemonPvPBattleResponse;
  }
  | {
    error: string;
  };

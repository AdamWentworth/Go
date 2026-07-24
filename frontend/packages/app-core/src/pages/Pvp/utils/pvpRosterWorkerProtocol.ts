import type {
  PokemonPvPBattleFighter,
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

export type PvPRosterWorkerResponse =
  | {
    kind: 'evaluation';
    response: PokemonPvPRosterEvaluationResponse;
  }
  | {
    error: string;
  };

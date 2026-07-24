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

export type PvPTeamRole = 'lead' | 'switch' | 'closer';

export type PvPTeamEvaluationMember = {
  fighter: PokemonPvPBattleFighter;
  role: PvPTeamRole;
};

export type PvPTeamEvaluationMemberResult = {
  fighterId: string;
  role: PvPTeamRole;
  averageRating: number;
  wins: number;
  draws: number;
  losses: number;
};

export type PvPTeamEvaluationOpponentResult = {
  fighterId: string;
  memberRatings: number[];
  bestMemberId: string;
  bestRating: number;
  covered: boolean;
};

export type PvPTeamEvaluationResponse = {
  mechanics: 'pvpoke-legacy';
  fieldSize: number;
  coverageCount: number;
  members: PvPTeamEvaluationMemberResult[];
  opponents: PvPTeamEvaluationOpponentResult[];
};

export type PvPTeamWorkerRequest = {
  kind: 'team';
  members: PvPTeamEvaluationMember[];
  opponents: PokemonPvPRosterEvaluationOpponent[];
};

export type PvPWorkerRequest =
  | PvPRosterWorkerRequest
  | PvPBattleWorkerRequest
  | PvPTeamWorkerRequest;

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
    kind: 'team';
    response: PvPTeamEvaluationResponse;
  }
  | {
    error: string;
  };

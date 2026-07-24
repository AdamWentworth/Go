import { useEffect, useMemo, useState } from 'react';

import { evaluatePokemonPvPRoster } from '@/services/pokemonDataService';
import type {
  PokemonPvPRankingEntry,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import type { OwnedPvPRankingEntry } from '../utils/pvpRoster';
import {
  buildPvPRosterEvaluationPlan,
} from '../utils/pvpRosterEvaluation';

type OwnedPvPRosterEvaluationState = {
  response: PokemonPvPRosterEvaluationResponse | null;
  loading: boolean;
  error: string | null;
};

const evaluationCache = new Map<
  string,
  PokemonPvPRosterEvaluationResponse
>();
const EVALUATION_BATCH_SIZE = 200;

const evaluatePlan = async (
  plan: NonNullable<
    ReturnType<typeof buildPvPRosterEvaluationPlan>
  >,
): Promise<PokemonPvPRosterEvaluationResponse> => {
  const results: PokemonPvPRosterEvaluationResponse['results'] = [];
  let fieldSize = plan.request.opponents.length;
  for (
    let start = 0;
    start < plan.request.candidates.length;
    start += EVALUATION_BATCH_SIZE
  ) {
    const response = await evaluatePokemonPvPRoster({
      ...plan.request,
      candidates: plan.request.candidates.slice(
        start,
        start + EVALUATION_BATCH_SIZE,
      ),
    });
    fieldSize = response.fieldSize;
    results.push(...response.results);
  }
  return {
    mechanics: 'pvpoke-legacy',
    fieldSize,
    results,
  };
};

export const useOwnedPvPRosterEvaluation = (
  enabled: boolean,
  owned: readonly OwnedPvPRankingEntry[],
  rankings: readonly PokemonPvPRankingEntry[],
  formatKey: string,
): OwnedPvPRosterEvaluationState => {
  const plan = useMemo(
    () => enabled
      ? buildPvPRosterEvaluationPlan(owned, rankings, formatKey)
      : null,
    [enabled, formatKey, owned, rankings],
  );
  const [state, setState] = useState<OwnedPvPRosterEvaluationState>({
    response: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!plan) {
      setState({ response: null, loading: false, error: null });
      return;
    }
    const cached = evaluationCache.get(plan.cacheKey);
    if (cached) {
      setState({ response: cached, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ response: null, loading: true, error: null });
    evaluatePlan(plan)
      .then((response) => {
        if (cancelled) return;
        evaluationCache.set(plan.cacheKey, response);
        setState({ response, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          response: null,
          loading: false,
          error: error instanceof Error
            ? error.message
            : 'Exact build evaluation is unavailable.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [plan]);

  return state;
};

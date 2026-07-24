import { useEffect, useMemo, useState } from 'react';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  PokemonPvPRankingEntry,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import type { OwnedPvPRankingEntry } from '../utils/pvpRoster';
import {
  buildPvPRosterEvaluationPlan,
} from '../utils/pvpRosterEvaluation';
import {
  getCachedPvPRosterEvaluation,
  setCachedPvPRosterEvaluation,
} from '../utils/pvpRosterEvaluationCache';
import { evaluatePvPRosterAsync } from '../utils/pvpRosterWorkers';

type OwnedPvPRosterEvaluationState = {
  response: PokemonPvPRosterEvaluationResponse | null;
  loading: boolean;
  error: string | null;
};

export const useOwnedPvPRosterEvaluation = (
  enabled: boolean,
  owned: readonly OwnedPvPRankingEntry[],
  rankings: readonly PokemonPvPRankingEntry[],
  variants: readonly PokemonVariant[],
  formatKey: string,
): OwnedPvPRosterEvaluationState => {
  const plan = useMemo(
    () => enabled
      ? buildPvPRosterEvaluationPlan(owned, rankings, variants, formatKey)
      : null,
    [enabled, formatKey, owned, rankings, variants],
  );
  const [state, setState] = useState<OwnedPvPRosterEvaluationState>({
    response: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!plan) {
      setState({
        response: null,
        loading: false,
        error: enabled && owned.length > 0 && rankings.length > 0
          ? 'The current format does not contain a battle-ready local reference field.'
          : null,
      });
      return;
    }

    const controller = new AbortController();
    setState({ response: null, loading: true, error: null });
    getCachedPvPRosterEvaluation(plan.cacheKey)
      .then((cached) => {
        if (controller.signal.aborted) return null;
        if (cached) return cached;
        return evaluatePvPRosterAsync(plan.request, controller.signal)
          .then(async (response) => {
            await setCachedPvPRosterEvaluation(plan.cacheKey, response);
            return response;
          });
      })
      .then((response) => {
        if (controller.signal.aborted || !response) return;
        setState({ response, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          response: null,
          loading: false,
          error: error instanceof Error
            ? error.message
            : 'Exact build evaluation is unavailable.',
        });
      });

    return () => {
      controller.abort();
    };
  }, [enabled, owned.length, plan, rankings.length]);

  return state;
};

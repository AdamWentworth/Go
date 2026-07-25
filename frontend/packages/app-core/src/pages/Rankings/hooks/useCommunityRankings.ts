import { useCallback, useEffect, useState } from 'react';
import type { PokemonCommunityRankingsPayload } from '@shared-contracts/search';
import { getPokemonCommunityRankings } from '@/services/searchService';

interface CommunityRankingsState {
  data: PokemonCommunityRankingsPayload | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useCommunityRankings(enabled: boolean): CommunityRankingsState {
  const [data, setData] = useState<PokemonCommunityRankingsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [requestVersion, setRequestVersion] = useState(0);

  const refresh = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void getPokemonCommunityRankings(100)
      .then((payload) => {
        if (!active) return;
        setData(payload);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'Community rankings are temporarily unavailable.',
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, requestVersion]);

  return { data, error, loading, refresh };
}

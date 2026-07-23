import { useEffect, useState } from 'react';

import {
  getPokemonCatalogManifest,
  getPokemonPvPDataChunk,
} from '@/services/pokemonDataService';
import { createScopedLogger } from '@/utils/logger';
import type { PokemonPvPRankingsPayload } from '@shared-contracts/pokemon';


const log = createScopedLogger('usePvPRankings');
let rankingsRequest: Promise<PokemonPvPRankingsPayload> | null = null;

async function loadRankings(): Promise<PokemonPvPRankingsPayload> {
  const manifest = await getPokemonCatalogManifest();
  const payload = await getPokemonPvPDataChunk(manifest);
  if (!payload) {
    throw new Error('The Pokemon API did not publish a PvP rankings snapshot.');
  }
  return payload;
}

function requestRankings(): Promise<PokemonPvPRankingsPayload> {
  if (!rankingsRequest) {
    rankingsRequest = loadRankings().catch((error) => {
      rankingsRequest = null;
      throw error;
    });
  }
  return rankingsRequest;
}

export function resetPvPRankingsRequestForTests(): void {
  rankingsRequest = null;
}

export function usePvPRankings() {
  const [data, setData] = useState<PokemonPvPRankingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void requestRankings()
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setError(null);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        log.error('Failed to load PvP rankings', reason);
        setError('PvP rankings are temporarily unavailable.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}

import { useEffect, useState } from 'react';

import {
  getPokemonCatalogManifest,
  getPokemonMovesChunk,
} from '@/services/pokemonDataService';
import { createScopedLogger } from '@/utils/logger';

import {
  buildPvPMoveMechanicsLookupFromChunk,
  type PvPMoveMechanicsLookup,
} from '../utils/pvpMoveHydration';

const log = createScopedLogger('usePvPMoveMechanics');
let mechanicsRequest: Promise<PvPMoveMechanicsLookup> | null = null;

const loadMoveMechanics = async (): Promise<PvPMoveMechanicsLookup> => {
  const manifest = await getPokemonCatalogManifest();
  const chunk = await getPokemonMovesChunk(manifest);
  if (!chunk) {
    throw new Error('The Pokemon API did not publish its move mechanics.');
  }
  return buildPvPMoveMechanicsLookupFromChunk(chunk);
};

const requestMoveMechanics = (): Promise<PvPMoveMechanicsLookup> => {
  if (!mechanicsRequest) {
    mechanicsRequest = loadMoveMechanics().catch((error) => {
      mechanicsRequest = null;
      throw error;
    });
  }
  return mechanicsRequest;
};

export const resetPvPMoveMechanicsRequestForTests = (): void => {
  mechanicsRequest = null;
};

export const usePvPMoveMechanics = (enabled: boolean) => {
  const [data, setData] = useState<PvPMoveMechanicsLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setLoading(true);
    setError(null);
    void requestMoveMechanics()
      .then((lookup) => {
        if (!active) return;
        setData(lookup);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        log.error('Failed to load PvP move mechanics', reason);
        setError('PvP battle mechanics are temporarily unavailable.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { data, loading, error };
};

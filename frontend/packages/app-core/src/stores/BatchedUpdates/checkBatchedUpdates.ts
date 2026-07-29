// checkBatchedUpdates.ts

import { getBatchedPokemonUpdates } from '../../db/indexedDB';
import { createScopedLogger } from '@/utils/logger';

type PeriodicUpdatesFn = () => void;
const log = createScopedLogger('checkBatchedUpdates');

export const checkBatchedUpdates = async (periodicUpdates: PeriodicUpdatesFn): Promise<void> => {
  try {
    const pokemonBatchedUpdates = await getBatchedPokemonUpdates();
    const hasPokemonUpdates = Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;

    if (hasPokemonUpdates) {
      log.debug('Batched updates found in IndexedDB: triggering periodic updates.');
      periodicUpdates();
    } else {
      log.debug('No batched updates found in IndexedDB.');
    }
  } catch (error) {
    log.error('Failed to check for batched updates in IndexedDB', error);
  }
};

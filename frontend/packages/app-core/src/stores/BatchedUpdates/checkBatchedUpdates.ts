// checkBatchedUpdates.ts

import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../db/indexedDB';
import { createScopedLogger } from '@/utils/logger';

type PeriodicUpdatesFn = () => void;
const log = createScopedLogger('checkBatchedUpdates');

export const checkBatchedUpdates = async (periodicUpdates: PeriodicUpdatesFn): Promise<void> => {
  try {
    const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
      getBatchedPokemonUpdates(),
      getBatchedTradeUpdates(),
    ]);

    const hasPokemonUpdates = Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;
    const hasTradeUpdates = Array.isArray(tradeBatchedUpdates) && tradeBatchedUpdates.length > 0;

    if (hasPokemonUpdates || hasTradeUpdates) {
      log.debug('Batched updates found in IndexedDB: triggering periodic updates.');
      periodicUpdates();
    } else {
      log.debug('No batched updates found in IndexedDB.');
    }
  } catch (error) {
    log.error('Failed to check for batched updates in IndexedDB', error);
  }
};

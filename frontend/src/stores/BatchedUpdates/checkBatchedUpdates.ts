// checkBatchedUpdates.ts

import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../db/indexedDB';

type PeriodicUpdatesFn = () => void;

export const checkBatchedUpdates = async (periodicUpdates: PeriodicUpdatesFn): Promise<void> => {
  try {
    const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
      getBatchedPokemonUpdates(),
      getBatchedTradeUpdates(),
    ]);

    const hasPokemonUpdates = Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;
    const hasTradeUpdates = Array.isArray(tradeBatchedUpdates) && tradeBatchedUpdates.length > 0;

    if (hasPokemonUpdates || hasTradeUpdates) {
      console.log('Batched updates found in IndexedDB: Triggering periodic updates.');
      periodicUpdates();
    } else {
      console.log('No batched updates found in IndexedDB.');
    }
  } catch (error) {
    console.error('Failed to check for batched updates in IndexedDB:', error);
  }
};

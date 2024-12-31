// checkBatchedUpdates.js

import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../services/indexedDB';

export const checkBatchedUpdates = async (periodicUpdates) => {
    try {
        // Fetch both the Pokémon and Trade batched updates
        const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
            getBatchedPokemonUpdates(),
            getBatchedTradeUpdates(),
        ]);

        // Check if either array of updates is non-empty
        const hasPokemonUpdates = pokemonBatchedUpdates && pokemonBatchedUpdates.length > 0;
        const hasTradeUpdates   = tradeBatchedUpdates && tradeBatchedUpdates.length > 0;

        if (hasPokemonUpdates || hasTradeUpdates) {
            console.log("Batched updates found in IndexedDB: Triggering periodic updates.");
            periodicUpdates();
        } else {
            console.log("No batched updates found in IndexedDB.");
        }
    } catch (error) {
        console.error("Failed to check for batched updates in IndexedDB:", error);
    }
};

// updateDetails.js

import { updatePokemonDetails } from '../../components/Collect/PokemonOwnership/pokemonOwnershipManager';
import { initializePokemonLists } from '../../components/Collect/PokemonOwnership/PokemonTradeListOperations';

export const updateDetails = (data, setData, updateLists) => (pokemonKey, details) => {
    updatePokemonDetails(pokemonKey, details, data.ownershipData);

    // Assuming the update is successful, we update the context state
    const newData = { ...data.ownershipData };
    const currentTimestamp = Date.now();
    newData[pokemonKey] = { ...newData[pokemonKey], ...details, last_update: currentTimestamp };

    setData(prevData => ({
        ...prevData,
        ownershipData: newData
    }));

    navigator.serviceWorker.ready.then(async registration => {
        registration.active.postMessage({
            action: 'syncData',
            data: { data: newData, timestamp: Date.now() }
        });

        const cache = await caches.open('pokemonCache');
        const cachedUpdates = await cache.match('/batchedUpdates');
        let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

        updatesData[pokemonKey] = newData[pokemonKey];

        await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
            headers: { 'Content-Type': 'application/json' }
        }));

        // Trigger the service worker to schedule sync
        registration.active.postMessage({
            action: 'scheduleSync'
        });

        // Now call updateLists after syncData is complete
        updateLists();
    });
};

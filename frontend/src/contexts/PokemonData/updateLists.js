// updateLists.js

import { updatePokemonLists } from '../../features/Collect/PokemonOwnership/PokemonTradeListOperations';

export const updateLists = (data, setData) => () => {
    updatePokemonLists(data.ownershipData, data.variants, sortedLists => {
        // Update the local state with the new lists
        setData(prevData => ({
            ...prevData,
            lists: sortedLists
        }));

        // Send updated lists to the service worker
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                action: 'syncLists',
                data: { data: sortedLists, timestamp: Date.now() }
            });
        });
    });
};

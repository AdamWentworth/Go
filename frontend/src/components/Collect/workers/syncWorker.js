// syncWorker.js

self.onmessage = function(e) {
    console.log('Worker received:', e.data);
    const { action, data } = e.data;
    switch (action) {
        case 'syncData':
            syncData(data);
            break;
        case 'updatePokemonLists':
            updatePokemonListsInCache(data);
            break;
    }
};

async function syncData(data) {
    try {
        const cache = await caches.open('pokemonCache');
        // Ensure you are storing the entire object including the timestamp
        const response = new Response(JSON.stringify({data: data.data, timestamp: data.timestamp}));
        await cache.put('/pokemonOwnership', response);
        postMessage({ status: 'success' });
    } catch (error) {
        postMessage({ status: 'failed', error });
    }
}

async function updatePokemonListsInCache(data) {
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ lists: data.lists, timestamp: data.timestamp }));
        await cache.put('/pokemonLists', response);
        postMessage({ status: 'success', message: 'Pokemon lists updated successfully under /pokemonLists with timestamp.' });
    } catch (error) {
        postMessage({ status: 'failed', message: 'Failed to update pokemon lists.', error });
    }
}
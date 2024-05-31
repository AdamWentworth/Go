// syncWorker.js

self.onmessage = function(e) {
    const { action, data } = e.data;
    switch (action) {
        case 'syncData':
            syncData(data);
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

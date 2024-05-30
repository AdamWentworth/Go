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
        const response = new Response(JSON.stringify(data.data));  // Ensure the data is correctly encapsulated.
        await cache.put('/pokemonOwnership', response);  // Using an absolute path to avoid relative URL issues.
        postMessage({ status: 'success' });
    } catch (error) {
        postMessage({ status: 'failed', error });
    }
}

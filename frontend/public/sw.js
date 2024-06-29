// Service Worker (sw.js)

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); // Become available to all pages
});

self.addEventListener('fetch', (event) => {
    // You can add caching strategies here if needed
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('message', (event) => {
    const { action, data } = event.data;
    switch (action) {
        case 'syncData':
            syncData(data);
            break;
        case 'updatePokemonLists':
            updatePokemonLists(data);
            break;
    }
});

async function syncData(data) {
    console.log('Sync data called:', data); // Add this log
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({data: data.data, timestamp: data.timestamp}), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/pokemonOwnership', response);
        console.log('Pokemon ownership data has been updated and cached.');
        sendMessageToClients({ status: 'success', message: 'Data synced successfully.' });
    } catch (error) {
        console.error('Failed to update pokemon ownership:', error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon ownership.', error });
    }
}

async function updatePokemonLists(data) {
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ lists: data.lists, timestamp: data.timestamp }), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/pokemonLists', response);
        console.log('Pokemon lists have been updated and cached.');
        sendMessageToClients({ status: 'success', message: 'Lists updated successfully.' });
    } catch (error) {
        console.error('Failed to update pokemon lists:', error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon lists.', error });
    }
}

function sendMessageToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}

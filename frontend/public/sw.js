// sw.js

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Bypass the service worker for specific API requests
    if (url.origin === 'http://localhost:3005' && url.pathname.startsWith('/api/ownershipData/')) {
        return; // Do not intercept this request
    }

    if (url.origin === 'https://photon.komoot.io') {
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request, { credentials: 'include' })
                    .then((response) => {
                        // Clone the response and update the cache
                        const clonedResponse = response.clone();
                        caches.open('dynamic-cache').then((cache) => {
                            cache.put(event.request, clonedResponse);
                        });
                        return response;
                    })
                    .catch((error) => {
                        console.error('Fetch failed:', error);
                        return caches.match('/offline.html'); // Fallback for failed fetch
                    });
            })
        );
    } else {
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.error('External Fetch failed:', error);
                return new Response('Network error occurred', {
                    status: 408,
                    statusText: 'Request Timeout',
                });
            })
        );
    }
});

// Event handler for messages
self.addEventListener('message', async (event) => {
    const { action, data } = event.data;  // Extract both data and location
    console.log(`Service Worker received message: ${action}`, data);

    switch (action) {
        case 'syncData':
            await syncData(data);
            break;
        case 'syncLists':
            await syncLists(data);
            break;
        case 'sendBatchedUpdatesToBackend':
            await sendBatchedUpdatesToBackend(data);  // Pass both data and location to the function
            break;
    }
});

async function syncData(data) {
    console.log(`Sync data called:`, data);
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ data: data.data, timestamp: data.timestamp }), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/pokemonOwnership', response);
        console.log(`Pokemon ownership data has been updated and cached.`);
        sendMessageToClients({ status: 'success', message: 'Data synced successfully.' });
    } catch (error) {
        console.error(`Failed to update pokemon ownership:`, error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon ownership.', error });
    }
}

async function syncLists(data) {
    console.log(`Sync lists called:`, data);
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ data: data.data, timestamp: data.timestamp }), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put('/pokemonLists', response);
        console.log(`Pokemon lists have been updated and cached.`);
        sendMessageToClients({ status: 'success', message: 'Lists updated successfully.' });
    } catch (error) {
        console.error(`Failed to update pokemon lists:`, error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon lists.', error });
    }
}

async function sendBatchedUpdatesToBackend(location) {
    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');
    if (!cachedResponse) {
        console.log(`No batched updates found.`);
        return;
    }

    const batchedUpdates = await cachedResponse.json();

    if (Object.keys(batchedUpdates).length === 0) {
        console.log(`Batched updates are empty.`);
        return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Syncing Updates to Backend:`, batchedUpdates);
    
    // Send the batched updates along with location to your backend API
    const payload = {
        ...batchedUpdates,   // Include the batched updates
        location: location || null  // Add location if available, otherwise null
    };

    try {
        const response = await fetch('http://localhost:3003/api/batchedUpdates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // Include cookies in the request
            body: JSON.stringify(payload),  // Send batched updates and location as payload
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Updates successfully sent to backend');
        const cache = await caches.open('pokemonCache');
        await cache.delete('/batchedUpdates');  // Clear the batched updates after successful sync
    } catch (error) {
        console.error('Failed to send updates to backend:', error);
    }
}

function sendMessageToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}

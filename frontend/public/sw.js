// Service Worker (sw.js)
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
    event.waitUntil(checkAndScheduleSync()); // Check and schedule sync if needed
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
        case 'scheduleSync':
            scheduleSync();
            break;
    }
});

let syncTimeoutId = null;
let syncIntervalId = null;
let isInitialSyncScheduled = false;

async function checkAndScheduleSync() {
    if (isInitialSyncScheduled) return;

    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');

    if (cachedResponse) {
        const batchedUpdates = await cachedResponse.json();
        if (Object.keys(batchedUpdates).length > 0) {
            console.log(`Batched updates found, starting periodic sync.`);
            scheduleInitialSync();
        }
    }
}

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
        await checkAndScheduleSync(); // Check and schedule sync if needed
    } catch (error) {
        console.error(`Failed to update pokemon ownership:`, error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon ownership.', error });
    }
}

async function updatePokemonLists(data) {
    console.log(`Update Pokemon lists called:`, data);
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ lists: data.lists, timestamp: data.timestamp }), {
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

function scheduleInitialSync() {
    if (isInitialSyncScheduled) return; // Prevent multiple initial syncs
    isInitialSyncScheduled = true;
    console.log(`[${new Date().toLocaleTimeString()}] Starting 1-minute initial backend sync timer`);
    syncTimeoutId = setTimeout(async () => {
        await sendBatchedUpdatesToBackend();
        schedulePeriodicSync();
    }, 60000); // 60 seconds delay
}

function schedulePeriodicSync() {
    if (syncIntervalId) return; // Prevent multiple intervals
    console.log(`Starting periodic sync every 1 minute.`);
    syncIntervalId = setInterval(async () => {
        await sendBatchedUpdatesToBackend();
    }, 60000); // 60 seconds interval
}

async function sendBatchedUpdatesToBackend() {
    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');
    if (!cachedResponse) {
        console.log(`No batched updates found, stopping periodic sync.`);
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        isInitialSyncScheduled = false;  // Reset the flag
        return;
    }

    const batchedUpdates = await cachedResponse.json();

    if (Object.keys(batchedUpdates).length === 0) {
        console.log(`Batched updates are empty, stopping periodic sync.`);
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        isInitialSyncScheduled = false;  // Reset the flag
        return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Syncing Updates to Backend:`, batchedUpdates);

    // Send the updates to your backend API
    try {
        await fetch('http://localhost:3003/api/batchedUpdates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // Include cookies in the request
            body: JSON.stringify(batchedUpdates),
        });
        console.log('Updates successfully sent to backend');
        await cache.delete('/batchedUpdates');
    } catch (error) {
        console.error('Failed to send updates to backend:', error);
    }
}

function sendMessageToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}

// Function to schedule sync when triggered
function scheduleSync() {
    if (!syncTimeoutId && !syncIntervalId) {
        scheduleInitialSync();
    }
}
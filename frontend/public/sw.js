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
        if (Object.keys(batchedUpdates).length > 0 && !syncIntervalId) {
            console.log(`Batched updates found, starting periodic sync.`);
            scheduleInitialSync();
            isInitialSyncScheduled = true;  // Set the flag to true
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
        scheduleSync(); // Ensure sync is scheduled after data is cached
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
    if (syncTimeoutId) clearTimeout(syncTimeoutId);
    console.log(`[${new Date().toLocaleTimeString()}] Starting 1-minute initial backend sync timer`);
    syncTimeoutId = setTimeout(async () => {
        await sendBatchedUpdatesToBackend();
        schedulePeriodicSync();
    }, 60000); // 60 seconds delay
}

function schedulePeriodicSync() {
    console.log(`Starting periodic sync every 1 minute.`);
    if (syncIntervalId) clearInterval(syncIntervalId);
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

    // Uncomment and modify the following code to send the updates to your backend
    // try {
    //     await fetch('https://your-backend-api.com/update', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(batchedUpdates),
    //     });
    //     console.log('Updates sent to backend:', batchedUpdates);
    //     await cache.delete('/batchedUpdates');
    // } catch (error) {
    //     console.error('Failed to send updates to backend:', error);
    // }

    // Clear updates after logging
    await cache.delete('/batchedUpdates');
    isInitialSyncScheduled = false;  // Reset the flag
}

function sendMessageToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}

// Function to schedule sync when triggered
function scheduleSync() {
    if (!syncTimeoutId) {
        scheduleInitialSync();
    }
}

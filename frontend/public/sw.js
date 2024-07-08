// Service Worker (sw.js)

let isLoggedIn = false;  // Global state to track if any user is logged in
console.log(`logged in:`, isLoggedIn);

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
            return fetch(event.request).catch((error) => {
                console.error('Fetch failed:', error);
                throw error;
            });
        })
    );
    event.waitUntil(checkAndScheduleSync()); // Check and schedule sync if needed
});

// Event handler for messages
self.addEventListener('message', async (event) => {
    const { action, data } = event.data;
    switch (action) {
        case 'syncData':
            await syncData(data);
            break;
        case 'syncLists':
            await syncLists(data);
            break;
        case 'scheduleSync':
            scheduleSync();
            break;
        case 'updateLoginStatus':
            isLoggedIn = data.isLoggedIn;  // Update the global logged-in state
            console.log(`Login status updated: ${isLoggedIn}`);
            if (!isLoggedIn) {
                clearTimers();
            } else {
                // When user logs in, immediately check and schedule sync if needed
                checkAndScheduleSync();
            }
            break;
    }
});

let syncTimeoutId = null;
let syncIntervalId = null;
let isInitialSyncScheduled = false;
let authStatusPromises = new Map();

async function checkAndScheduleSync() {
    if (isInitialSyncScheduled || !isLoggedIn) return;

    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');

    if (cachedResponse) {
        const batchedUpdates = await cachedResponse.json();
        if (Object.keys(batchedUpdates).length > 0) {
            console.log(`Batched updates found, starting immediate sync.`);
            await immediateSync(); // Perform immediate sync
            schedulePeriodicSync(); // Schedule periodic sync
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
        if (isLoggedIn) await checkAndScheduleSync(); // Check and schedule sync if needed
    } catch (error) {
        console.error(`Failed to update pokemon ownership:`, error);
        sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon ownership.', error });
    }
}

async function syncLists(data) {
    console.log(`Sync lists called:`, data);
    try {
        const cache = await caches.open('pokemonCache');
        const response = new Response(JSON.stringify({ lists: data.data, timestamp: data.timestamp }), {
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
    if (isInitialSyncScheduled || !isLoggedIn) return; // Prevent multiple initial syncs
    isInitialSyncScheduled = true;
    console.log(`[${new Date().toLocaleTimeString()}] Starting immediate sync followed by 1-minute interval`);
    immediateSync().then(schedulePeriodicSync); // Perform immediate sync and then schedule periodic sync
}

function schedulePeriodicSync() {
    if (syncIntervalId || !isLoggedIn) return; // Prevent multiple intervals
    console.log(`Starting periodic sync every 1 minute.`);
    syncIntervalId = setInterval(async () => {
        await sendBatchedUpdatesToBackend();
    }, 60000); // 60 seconds interval
}

async function immediateSync() {
    await sendBatchedUpdatesToBackend();
}

async function sendBatchedUpdatesToBackend() {
    if (!isLoggedIn) {
        console.log("User is not logged in. Skipping backend update.");
        clearTimers();
        return;
    }

    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');
    if (!cachedResponse) {
        console.log(`No batched updates found, stopping periodic sync.`);
        clearTimers();
        return;
    }

    const batchedUpdates = await cachedResponse.json();

    if (Object.keys(batchedUpdates).length === 0) {
        console.log(`Batched updates are empty, stopping periodic sync.`);
        clearTimers();
        return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Syncing Updates to Backend:`, batchedUpdates);

    // Send the updates to your backend API
    try {
        const response = await fetch('http://localhost:3003/api/batchedUpdates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',  // Include cookies in the request
            body: JSON.stringify(batchedUpdates),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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

function clearTimers() {
    if (syncTimeoutId) {
        clearTimeout(syncTimeoutId);
        syncTimeoutId = null;
    }
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
    isInitialSyncScheduled = false;
}

// Function to schedule sync when triggered
function scheduleSync() {
    if (!syncTimeoutId && !syncIntervalId && isLoggedIn) {
        scheduleInitialSync();
    }
}

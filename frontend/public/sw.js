// sw.js

let isLoggedIn = false;  // Global state to track if any user is logged in

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

    // Handle requests to Google Fonts
    if (url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.error('Fetch failed:', error);
                throw error;
            })
        );
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request, { credentials: 'include' }).catch((error) => {
                    console.error('Fetch failed:', error);
                    throw error;
                });
            })
        );
    } else {
        // Handle requests to other origins
        event.respondWith(
            fetch(event.request).catch((error) => {
                console.error('Fetch failed:', error);
                throw error;
            })
        );
    }
    event.waitUntil(checkAndScheduleSync());
});

// Event handler for messages
self.addEventListener('message', async (event) => {
    const { action, data } = event.data;
    console.log(`Service Worker received message: ${action}`, data); // Add this log
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
let isSyncInProgress = false; // Flag to track if a sync is in progress

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
    if (!isLoggedIn || isSyncInProgress) {
        console.log("User is not logged in or sync is already in progress. Skipping backend update.");
        return;
    }

    isSyncInProgress = true; // Set sync in progress flag

    const cache = await caches.open('pokemonCache');
    const cachedResponse = await cache.match('/batchedUpdates');
    if (!cachedResponse) {
        console.log(`No batched updates found, stopping periodic sync.`);
        clearTimers();
        isSyncInProgress = false; // Reset sync in progress flag
        return;
    }

    const batchedUpdates = await cachedResponse.json();

    if (Object.keys(batchedUpdates).length === 0) {
        console.log(`Batched updates are empty, stopping periodic sync.`);
        clearTimers();
        isSyncInProgress = false; // Reset sync in progress flag
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
    } finally {
        isSyncInProgress = false; // Reset sync in progress flag
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
    isSyncInProgress = false; // Reset sync in progress flag
}

// Function to schedule sync when triggered
function scheduleSync() {
    if (!syncTimeoutId && !syncIntervalId && isLoggedIn) {
        scheduleInitialSync();
    }
}

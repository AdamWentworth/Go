// sw.js

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If it's same-origin, attempt to serve from cache first, fallback to fetch
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          return await fetch(event.request, { credentials: 'include' });
        } catch (error) {
          // Return a fallback or empty response to prevent errors
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
    );
  } else {
    // For cross-origin requests, just do a normal fetch with fallback
    event.respondWith(
      fetch(event.request).catch((error) => {
        return new Response('', { status: 200, statusText: 'OK' });
      })
    );
  }
});

self.addEventListener('message', async (event) => {
  const { action, data } = event.data;
  console.log(`Service Worker received message: ${action}`, data);

  switch (action) {
    case 'syncData':
      await syncData(data);
      break;
    case 'syncLists':
      await syncLists(data);
      break;
    case 'sendBatchedUpdatesToBackend':
      await sendBatchedUpdatesToBackend(data);
      break;
  }
});

// -----------------------------------------------------------------------------
// Sync Ownership Data
// -----------------------------------------------------------------------------
async function syncData(data) {
  console.log('Sync data called:', data);
  try {
    const startStoreOwnership = Date.now();
    await storeOwnershipDataInIndexedDB(data); // Now correctly waits for completion
    const endStoreOwnership = Date.now();
    console.log(
      `Pokemon ownership data has been updated and stored in IndexedDB in ${
        endStoreOwnership - startStoreOwnership
      } ms.`
    );
    sendMessageToClients({
      status: 'success',
      message: 'Data synced successfully.',
    });
  } catch (error) {
    console.error('Failed to update pokemon ownership:', error);
    sendMessageToClients({
      status: 'failed',
      message: 'Failed to update pokemon ownership.',
      error,
    });
  }
}

async function storeOwnershipDataInIndexedDB(data) {
  const db = await openDB(); // Opens 'pokemonDB'
  const transaction = db.transaction(['pokemonOwnership'], 'readwrite');
  const ownershipStore = transaction.objectStore('pokemonOwnership');

  // Clear the 'pokemonOwnership' store
  ownershipStore.clear();

  // Write ownershipData into IndexedDB
  const ownershipData = data.data;
  for (const instance_id in ownershipData) {
    const item = { ...ownershipData[instance_id], instance_id };
    ownershipStore.put(item);
  }

  // Return a promise that resolves when the transaction is complete
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('IndexedDB transaction completed successfully.');
      resolve();
    };
    transaction.onerror = (event) => {
      console.error('IndexedDB transaction failed:', event.target.error);
      reject(event.target.error);
    };
    transaction.onabort = (event) => {
      console.error('IndexedDB transaction aborted:', event.target.error);
      reject(event.target.error);
    };
  });
}

// -----------------------------------------------------------------------------
// Sync Lists Data
// -----------------------------------------------------------------------------
async function syncLists(data) {
  console.log('Sync lists called:', data);
  try {
    const { data: lists } = data;

    const startStoreLists = Date.now();
    // Store lists into IndexedDB
    await storeListsInIndexedDB(lists);
    const endStoreLists = Date.now();

    console.log(
      `Pokemon lists have been updated and stored in IndexedDB in ${
        endStoreLists - startStoreLists
      } ms.`
    );
    sendMessageToClients({ status: 'success', message: 'Lists updated successfully.' });
  } catch (error) {
    console.error('Failed to update pokemon lists:', error);
    sendMessageToClients({
      status: 'failed',
      message: 'Failed to update pokemon lists.',
      error,
    });
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokemonDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create stores if they don't exist
      const stores = ['pokemonVariants', 'pokemonOwnership'];
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === 'pokemonVariants') {
            db.createObjectStore(storeName, { keyPath: 'pokemonKey' });
          } else if (storeName === 'pokemonOwnership') {
            db.createObjectStore(storeName, { keyPath: 'instance_id' });
          }
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openListsDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokemonListsDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const stores = ['owned', 'unowned', 'wanted', 'trade'];
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'instance_id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeListsInIndexedDB(lists) {
  const db = await openListsDB();

  // Clear stores before adding new data
  const clearTransaction = db.transaction(['owned', 'unowned', 'wanted', 'trade'], 'readwrite');
  for (const listName of ['owned', 'unowned', 'wanted', 'trade']) {
    const store = clearTransaction.objectStore(listName);
    await store.clear();
  }
  await clearTransaction.done;

  // Store new lists
  const transaction = db.transaction(['owned', 'unowned', 'wanted', 'trade'], 'readwrite');
  for (const listName of ['owned', 'unowned', 'wanted', 'trade']) {
    const store = transaction.objectStore(listName);
    const list = lists[listName];
    for (const instance_id in list) {
      const item = list[instance_id];
      const data = { ...item, instance_id };
      store.put(data);
    }
  }
  await transaction.done;
}

// -----------------------------------------------------------------------------
// New: Manage Batched Updates in batchedUpdatesDB
// -----------------------------------------------------------------------------
function openUpdatesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('batchedUpdatesDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create batched updates stores if not exist
      if (!db.objectStoreNames.contains('batchedPokemonUpdates')) {
        db.createObjectStore('batchedPokemonUpdates', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('batchedTradeUpdates')) {
        db.createObjectStore('batchedTradeUpdates', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getBatchedPokemonUpdates() {
  const db = await openUpdatesDB();
  const tx = db.transaction('batchedPokemonUpdates', 'readonly');
  const store = tx.objectStore('batchedPokemonUpdates');
  const allRequest = store.getAll();
  const result = await new Promise((resolve, reject) => {
    allRequest.onsuccess = () => resolve(allRequest.result);
    allRequest.onerror = () => reject(allRequest.error);
  });
  await tx.done;
  return result;
}

async function getBatchedTradeUpdates() {
  const db = await openUpdatesDB();
  const tx = db.transaction('batchedTradeUpdates', 'readonly');
  const store = tx.objectStore('batchedTradeUpdates');
  const allRequest = store.getAll();
  const result = await new Promise((resolve, reject) => {
    allRequest.onsuccess = () => resolve(allRequest.result);
    allRequest.onerror = () => reject(allRequest.error);
  });
  await tx.done;
  return result;
}

async function clearBatchedPokemonUpdates() {
  const db = await openUpdatesDB();
  const tx = db.transaction('batchedPokemonUpdates', 'readwrite');
  await tx.objectStore('batchedPokemonUpdates').clear();
  await tx.done;
}

async function clearBatchedTradeUpdates() {
  const db = await openUpdatesDB();
  const tx = db.transaction('batchedTradeUpdates', 'readwrite');
  await tx.objectStore('batchedTradeUpdates').clear();
  await tx.done;
}

// Optional: Clear both at once (if you prefer):
async function clearAllBatchedUpdates() {
  await Promise.all([clearBatchedPokemonUpdates(), clearBatchedTradeUpdates()]);
}

// -----------------------------------------------------------------------------
// Send Batched Updates to Backend (Combining Pokémon + Trades)
// -----------------------------------------------------------------------------
async function sendBatchedUpdatesToBackend(location) {
  try {
    const [pokemonUpdates, tradeUpdates] = await Promise.all([
      getBatchedPokemonUpdates(),
      getBatchedTradeUpdates()
    ]);

    const hasPokemonUpdates = pokemonUpdates && pokemonUpdates.length > 0;
    const hasTradeUpdates = tradeUpdates && tradeUpdates.length > 0;

    if (!hasPokemonUpdates && !hasTradeUpdates) {
      console.log(`No batched updates found (Pokémon or Trades).`);
      return;
    }

    // Prepare your request payload however you need:
    const payload = {
      location: location || null,
      pokemonUpdates, // array of objects from 'batchedPokemonUpdates'
      tradeUpdates    // array of objects from 'batchedTradeUpdates'
    };

    console.log(`[${new Date().toLocaleTimeString()}] Syncing Updates to Backend:`, payload);

    const response = await fetch(`${REACT_APP_RECEIVER_API_URL}/batchedUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Updates successfully sent to backend');
    await clearAllBatchedUpdates(); // Clear both Pokémon + Trade updates

  } catch (error) {
    console.error('Failed to send updates to backend:', error);
  }
}

// -----------------------------------------------------------------------------
// Utility: Post a message to all clients
// -----------------------------------------------------------------------------
function sendMessageToClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(msg));
  });
}

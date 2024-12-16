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
  if (
    (url.origin === 'http://localhost:3005' && url.pathname.startsWith('/api/ownershipData/')) ||
    url.origin === 'http://localhost:3006' ||
    (url.origin === 'http://localhost:3008' && url.pathname.startsWith('/api/sse' ||
      url.origin === 'http://localhost:3007'
    ))
  ) {
    return; // Do not intercept this request
  }

  if (url.origin === 'https://photon.komoot.io') {
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          return await fetch(event.request, { credentials: 'include' });
        } catch (error) {
          // Return a fallback response or an empty response to prevent errors
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch((error) => {
        // Return a fallback response or an empty response to prevent errors
        return new Response('', { status: 200, statusText: 'OK' });
      })
    );
  }
});

// Event handler for messages
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

async function syncData(data) {
  console.log(`Sync data called:`, data);
  try {
      const startStoreOwnership = Date.now();
      await storeOwnershipDataInIndexedDB(data);
      const endStoreOwnership = Date.now();
      console.log(`Pokemon ownership data has been updated and stored in IndexedDB in ${(endStoreOwnership - startStoreOwnership)} ms.`);
      sendMessageToClients({ status: 'success', message: 'Data synced successfully.' });
  } catch (error) {
      console.error(`Failed to update pokemon ownership:`, error);
      sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon ownership.', error });
  }
}

async function storeOwnershipDataInIndexedDB(data) {
  const db = await openDB();
  const transaction = db.transaction(['pokemonOwnership'], 'readwrite');
  const ownershipStore = transaction.objectStore('pokemonOwnership');

  // Clear the 'pokemonOwnership' store
  await ownershipStore.clear();

  // Write ownershipData into IndexedDB
  const ownershipData = data.data;
  for (const instance_id in ownershipData) {
      const item = { ...ownershipData[instance_id], instance_id };
      ownershipStore.put(item);
  }

  await transaction.done;
}

async function syncLists(data) {
  console.log(`Sync lists called:`, data);
  try {
    const { data: lists } = data;

    const startStoreLists = Date.now();
    // Store lists into IndexedDB
    await storeListsInIndexedDB(lists);
    const endStoreLists = Date.now();

    console.log(`Pokemon lists have been updated and stored in IndexedDB in ${(endStoreLists - startStoreLists)} ms.`);
    sendMessageToClients({ status: 'success', message: 'Lists updated successfully.' });
  } catch (error) {
    console.error(`Failed to update pokemon lists:`, error);
    sendMessageToClients({ status: 'failed', message: 'Failed to update pokemon lists.', error });
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pokemonDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create stores if they don't exist
      const stores = ['pokemonVariants', 'pokemonOwnership', 'batchedUpdates'];
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          if (storeName === 'pokemonVariants') {
            db.createObjectStore(storeName, { keyPath: 'pokemonKey' });
          } else if (storeName === 'pokemonOwnership') {
            db.createObjectStore(storeName, { keyPath: 'instance_id' });
          } else {
            db.createObjectStore(storeName, { keyPath: 'key' });
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
      // Create stores if they don't exist
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

async function getBatchedUpdates() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
      const transaction = db.transaction('batchedUpdates', 'readonly');
      const store = transaction.objectStore('batchedUpdates');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
  });
}

async function clearBatchedUpdates() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
      const transaction = db.transaction('batchedUpdates', 'readwrite');
      const store = transaction.objectStore('batchedUpdates');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
  });
}

async function sendBatchedUpdatesToBackend(location) {
  const batchedUpdates = await getBatchedUpdates();

  if (!batchedUpdates || batchedUpdates.length === 0) {
      console.log(`No batched updates found.`);
      return;
  }

  // Transform the array of updates into an object with keys
  const formattedBatchedUpdates = batchedUpdates.reduce((acc, update) => {
      acc[update.key] = { ...update };
      delete acc[update.key].key; // Remove the key property from the individual data objects
      return acc;
  }, {});

  console.log(`[${new Date().toLocaleTimeString()}] Syncing Updates to Backend:`, formattedBatchedUpdates);

  const payload = {
      ...formattedBatchedUpdates,  // Include the formatted updates as key-value pairs
      location: location || null   // Add location if available, otherwise null
  };

  try {
      const response = await fetch('http://localhost:3003/api/batchedUpdates', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Updates successfully sent to backend');
      await clearBatchedUpdates();  // Clear the batched updates after successful sync
  } catch (error) {
      console.error('Failed to send updates to backend:', error);
  }
}

function sendMessageToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}
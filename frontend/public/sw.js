/* sw.js — lean: network batching only (no IndexedDB writes) */

let RECEIVER_API_URL = null;
let DEBUG_SW = true; // can be toggled via SET_CONFIG
let IS_LOGGED_IN = false; // <-- NEW

/* ------------------------------- Logging --------------------------------- */
function log(tag, obj) {
  if (!DEBUG_SW) return;
  try {
    console.log(`[SW] ${tag}`, obj ?? '');
  } catch {}
}

/* ---------------------------- Config from app ---------------------------- */
self.addEventListener('message', (event) => {
  const { type, payload, action, data } = event.data || {};

  // Config (e.g., { type: 'SET_CONFIG', payload: { RECEIVER_API_URL, DEBUG_SW, IS_LOGGED_IN } })
  if (type === 'SET_CONFIG' && payload) {
    if (payload.RECEIVER_API_URL) RECEIVER_API_URL = payload.RECEIVER_API_URL;
    if (typeof payload.DEBUG_SW === 'boolean') DEBUG_SW = payload.DEBUG_SW;
    if (typeof payload.IS_LOGGED_IN === 'boolean') IS_LOGGED_IN = payload.IS_LOGGED_IN; // <-- NEW
    log('Config', { RECEIVER_API_URL, DEBUG_SW, IS_LOGGED_IN });
    return;
  }

  // Auth state updates (explicit)
  // e.g., { type: 'AUTH_STATE', payload: { isLoggedIn: true/false } }
  if (type === 'AUTH_STATE' && payload) {
    if (typeof payload.isLoggedIn === 'boolean') {
      IS_LOGGED_IN = payload.isLoggedIn;
      log('AuthState', { IS_LOGGED_IN });
    }
    return;
  }

  if (!action) return;

  (async () => {
    try {
      switch (action) {
        case 'sendBatchedUpdatesToBackend':
          await sendBatchedUpdatesToBackend(data);
          break;

        // Intentionally unsupported
        case 'syncData':
        case 'syncLists':
          log('skip', { action, reason: 'SW no longer writes IndexedDB' });
          break;

        default:
          log('Unknown action', action);
      }
    } catch (err) {
      console.error('[SW] Action failed:', action, err);
    }
  })();
});

/* -------------------------- Lifecycle (no cache) ------------------------- */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ------------------------------ Fetch passthru --------------------------- */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        if (cached) return cached;
        try {
          return await fetch(event.request, { credentials: 'include' });
        } catch {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => new Response('', { status: 200, statusText: 'OK' }))
    );
  }
});

/* =========================================================================
   updatesDB for network batching (plain IDB API)
   ========================================================================= */
function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openUpdatesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('updatesDB', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('batchedPokemonUpdates')) {
        db.createObjectStore('batchedPokemonUpdates', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('batchedTradeUpdates')) {
        db.createObjectStore('batchedTradeUpdates', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllFromStore(db, storeName) {
  const tx = db.transaction([storeName], 'readonly');
  const store = tx.objectStore(storeName);
  const req = store.getAll();
  const result = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  return result;
}

async function clearStore(db, storeName) {
  const tx = db.transaction([storeName], 'readwrite');
  const store = tx.objectStore(storeName);
  const req = store.clear();
  await new Promise((resolve, reject) => {
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
}

/* =========================================================================
   Message handlers
   ========================================================================= */
async function sendBatchedUpdatesToBackend(location) {
  try {
    if (!IS_LOGGED_IN) {
      log('batchedUpdates:skip', { reason: 'not logged in' });
      return;
    }

    const db = await openUpdatesDB();
    const [pokemonUpdates, tradeUpdates] = await Promise.all([
      getAllFromStore(db, 'batchedPokemonUpdates'),
      getAllFromStore(db, 'batchedTradeUpdates'),
    ]);

    const hasPokemon = Array.isArray(pokemonUpdates) && pokemonUpdates.length > 0;
    const hasTrades = Array.isArray(tradeUpdates) && tradeUpdates.length > 0;

    if (!hasPokemon && !hasTrades) {
      log('batchedUpdates:none', {});
      return;
    }

    if (!RECEIVER_API_URL) {
      log('batchedUpdates:skip', { reason: 'RECEIVER_API_URL not set' });
      return;
    }

    const payload = { location: location || null, pokemonUpdates, tradeUpdates };
    log('batchedUpdates:POST', { payload });

    const res = await fetch(`${RECEIVER_API_URL}/batchedUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    await Promise.all([
      clearStore(db, 'batchedPokemonUpdates'),
      clearStore(db, 'batchedTradeUpdates'),
    ]);
    log('batchedUpdates:cleared', {});
  } catch (err) {
    console.error('[SW] sendBatchedUpdatesToBackend failed:', err);
  }
}

/* ------------------------------- Utilities ------------------------------- */
function sendMessageToClients(msg) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((c) => c.postMessage(msg));
  });
}

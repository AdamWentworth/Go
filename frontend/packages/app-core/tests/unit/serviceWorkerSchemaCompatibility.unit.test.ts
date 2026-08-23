import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workerPath = [
  resolve(process.cwd(), 'public/sw.js'),
  resolve(process.cwd(), 'packages/app-core/public/sw.js'),
  resolve(process.cwd(), '../../packages/app-core/public/sw.js'),
].find(existsSync);

if (!workerPath) {
  throw new Error('Could not locate the app-core service worker source.');
}

const workerSource = readFileSync(workerPath, 'utf8');

describe('service worker update queue compatibility', () => {
  it('opens the current updatesDB schema instead of requesting a stale version', () => {
    expect(workerSource).toContain("indexedDB.open('updatesDB')");
    expect(workerSource).not.toMatch(
      /indexedDB\.open\(['"]updatesDB['"]\s*,\s*\d+/,
    );
  });

  it('keeps mobile sync alive and closes the database after each attempt', () => {
    expect(workerSource).toContain('event.waitUntil(operation)');
    expect(workerSource).toContain('db?.close()');
  });

  it('waits for user approval before activating an updated worker', () => {
    expect(workerSource).toContain("type === 'SKIP_WAITING'");
    expect(workerSource).not.toContain(
      "self.addEventListener('install', () => self.skipWaiting())",
    );
  });

  it('only reads and sends the Pokémon update queue', () => {
    expect(workerSource).toContain("'batchedPokemonUpdates'");
    expect(workerSource).not.toContain('batchedTradeUpdates');
    expect(workerSource).not.toContain('tradeUpdates');
  });

  it('uses an idempotency key and only acknowledges unchanged sent records', () => {
    expect(workerSource).toContain('sync_batch_id: await batchIDFor(pokemonUpdates)');
    expect(workerSource).toContain('deleteSentUpdates(db, pokemonUpdates)');
    expect(workerSource).toContain("'acknowledgedPokemonUpdates'");
    expect(workerSource).toContain('current?.last_update');
    expect(workerSource).not.toContain("store.clear()");
  });
});

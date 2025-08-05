// tests/variants/integration/loadVariants.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enableLogging, testLogger }                 from '../../../setupTests';

import { loadVariants }                              from '@/features/variants/utils/loadVariants';
import { clearStore }                                from '@/db/instancesDB';
import { useLiveVariants }                           from '../../../utils/liveVariantCache';
import { useLivePokedexLists }                       from '../../../utils/livePokedexListsCache';

/* helper – wipe both object stores + timestamps */
async function wipePersistentCache() {
  await Promise.all([
    clearStore('pokemonVariants'),
    clearStore('pokedexLists').catch(() => {}),         // ignore NotFound on first run
  ]);
  localStorage.removeItem('variantsTimestamp');
  localStorage.removeItem('pokedexListsTimestamp');
}

/*────────────────────────  TEST SUITE  ────────────────────────*/
const suiteStart = Date.now();

describe('♻️ Integration - loadVariants', () => {
  /* ───── suite header ───── */
  beforeAll(() => {
    enableLogging('verbose');                                           // turn on pretty logs
    testLogger.fileStart('loadVariants live tests');
    testLogger.suiteStart('Cold-start / warm-cache scenarios');
  });

  afterAll(() => {
    testLogger.complete('loadVariants live suite', Date.now() - suiteStart);
    testLogger.suiteComplete();   // pop indent
    testLogger.fileEnd();         // pop file indent
  });

  /*───────────────────────────────────────────────────────────*/
  it(
    'cold-start → hydrates from network & builds lists',
    async () => {
      const t0 = Date.now();
      try {
        testLogger.testStep('wipe persistent cache');
        await wipePersistentCache();
        testLogger.assertion('IndexedDB + localStorage cleared');

        testLogger.testStep('invoke loadVariants() – cold path');
        const { variants, pokedexLists, listsBuiltNow } = await loadVariants();

        expect(variants.length).toBeGreaterThan(1_000);
        expect(Object.keys(pokedexLists).length).toBeGreaterThan(0);
        expect(listsBuiltNow).toBe(true);
        testLogger.metric('Variants fetched', variants.length);
        testLogger.metric('List keys', Object.keys(pokedexLists).length);
        testLogger.assertion('Cold-start produced data & rebuilt lists');

        testLogger.testStep('verify fresh timestamps saved');
        const tsVar  = Number(localStorage.getItem('variantsTimestamp'));
        const tsList = Number(localStorage.getItem('pokedexListsTimestamp'));
        expect(tsVar).toBeGreaterThan(0);
        expect(tsList).toBeGreaterThan(0);
        testLogger.assertion('Freshness timestamps present');
      } catch (err) {
        testLogger.errorDetail(err);
        throw err;
      } finally {
        testLogger.complete('cold-start test', Date.now() - t0);
      }
    },
    20_000,
  );

  /*───────────────────────────────────────────────────────────*/
  it(
    'warm-cache → returns without rebuilding lists',
    async () => {
      const t0 = Date.now();
      try {
        testLogger.testStep('call loadVariants() – warm path');
        const { listsBuiltNow } = await loadVariants();

        expect(listsBuiltNow).toBe(false);
        testLogger.assertion('Returned via fast-path (IDB only)');
      } catch (err) {
        testLogger.errorDetail(err);
        throw err;
      } finally {
        testLogger.complete('warm-cache test', Date.now() - t0);
      }
    },
    20_000,    // give plenty of room for your environment
  );

  /*───────────────────────────────────────────────────────────*/
  it(
    'stale lists → variants reused, lists rebuilt',
    async () => {
      const t0 = Date.now();
      try {
        testLogger.testStep('force lists timestamp 48 h old');
        const now = Date.now();
        localStorage.setItem('pokedexListsTimestamp', String(now - 1000 * 60 * 60 * 48));

        const { listsBuiltNow } = await loadVariants();

        expect(listsBuiltNow).toBe(true);
        const newListsTS = Number(localStorage.getItem('pokedexListsTimestamp'));
        expect(newListsTS).toBeGreaterThan(now);
        testLogger.assertion('Lists were rebuilt & timestamp updated');
      } catch (err) {
        testLogger.errorDetail(err);
        throw err;
      } finally {
        testLogger.complete('stale-lists test', Date.now() - t0);
      }
    },
    15_000,
  );

  /*───────────────────────────────────────────────────────────*/
  it(
    'live helpers reuse the newly built IndexedDB data',
    async () => {
      const t0 = Date.now();
      try {
        testLogger.testStep('obtain live variants via shared cache helper');
        const variants = await useLiveVariants();
        testLogger.metric('Cached variants', variants.length);

        testLogger.testStep('obtain live pokedex lists via helper');
        const pokedexLists = await useLivePokedexLists();
        testLogger.metric('Default-list size', pokedexLists.default.length);

        expect(variants.length).toBeGreaterThan(1_000);
        expect(pokedexLists.default.length).toBeGreaterThan(800);
        testLogger.assertion('Helpers returned consistent live data');
      } catch (err) {
        testLogger.errorDetail(err);
        throw err;
      } finally {
        testLogger.complete('helper-cache test', Date.now() - t0);
      }
    },
  );
});
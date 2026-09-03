import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  chromium,
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

import { installE2eRoutes } from './support/e2eRoutes';
import { openCaughtPokemonList, openPokemonPage } from './support/pokemonApp';

type ContractRoute = {
  id: string;
  auth: 'guest' | 'signed-in';
  vite: string;
  native: string;
};

type MetricSample = {
  scenarioId: string;
  metric: string;
  unit: 'ms' | 'bytes' | 'count' | 'fps' | 'percent';
  direction: 'lower' | 'higher';
  value: number;
  sampleIndex: number;
  phase?: string;
  diagnostic?: boolean;
};

type BrowserSnapshot = {
  routeReadyMs: number;
  mainThreadBlockingMs: number;
  maxFrameGapMs: number;
  firstContentfulPaintMs: number | null;
  largestContentfulPaintMs: number | null;
  transferSizeBytes: number;
  domNodeCount: number;
  jsHeapBytes: number | null;
};

const frontendDirectory = path.resolve(process.cwd(), '../..');
const contract = JSON.parse(readFileSync(
  path.resolve(frontendDirectory, 'performance-parity/contract.json'),
  'utf8',
)) as { routes: ContractRoute[] };
const performanceProfile = process.env.POKEGONEXUS_PERFORMANCE_PROFILE === 'physical-android'
  ? 'physical-android'
  : 'browser-proxy';
const reportPath = path.resolve(
  process.env.POKEGONEXUS_PERFORMANCE_REPORT
    ?? path.resolve(
      process.cwd(),
      `.artifacts/performance-parity/vite-${performanceProfile}.json`,
    ),
);
const repetitions = Math.max(1, Number(process.env.POKEGONEXUS_PERFORMANCE_SAMPLES ?? 3));
const workflowsOnly = process.env.POKEGONEXUS_PERFORMANCE_WORKFLOWS_ONLY === 'true';
const routeFilter = process.env.POKEGONEXUS_PERFORMANCE_ROUTE_FILTER?.trim() ?? '';
const samples: MetricSample[] = [];
const androidDeviceId = process.env.POKEGONEXUS_ANDROID_DEVICE_ID?.trim() ?? '';
const androidChromePackage = process.env.POKEGONEXUS_ANDROID_CHROME_PACKAGE?.trim()
  || 'com.android.chrome';
const androidCdpUrl = process.env.POKEGONEXUS_ANDROID_CDP_URL?.trim()
  || 'http://127.0.0.1:9222';
const webBaseUrl = (process.env.E2E_BASE_URL?.trim()
  || `http://127.0.0.1:${process.env.E2E_PORT?.trim() || '3100'}`).replace(/\/+$/, '');

const adbPath = process.env.ADB_BIN?.trim()
  || path.resolve(
    process.env.ANDROID_SDK_ROOT?.trim()
      || process.env.ANDROID_HOME?.trim()
      || path.resolve(os.homedir(), 'Android/Sdk'),
    'platform-tools/adb',
  );

const signedInUser = {
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  allowLocation: false,
  email: 'performance@example.test',
  location: 'Burnaby, British Columbia, Canada',
  pokemonGoName: 'PerformanceTrainerGO',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
  trainerCode: '1234 5678 9012',
  user_id: 'performance-user',
  username: 'PerformanceTrainer',
};

const allPerformanceInstances = JSON.parse(readFileSync(
  path.resolve(
    frontendDirectory,
    'packages/app-core/tests/__helpers__/fixtures/instances.json',
  ),
  'utf8',
).replace(/^\uFEFF/, '')) as Record<string, Record<string, unknown>>;
const performanceCatalogEntries = (JSON.parse(readFileSync(
  path.resolve(
    frontendDirectory,
    'packages/app-core/tests/__helpers__/fixtures/pokemons.json',
  ),
  'utf8',
).replace(/^\uFEFF/, '')) as unknown[]).length;
const performanceInstances = Object.fromEntries(
  Object.entries(allPerformanceInstances).slice(0, 180).map(([instanceId, instance], index) => {
    const normalized = {
      ...instance,
      instance_id: instance.instance_id ?? instanceId,
      variant_id: instance.variant_id ?? instanceId.replace(
        /_[0-9a-f]{8}-[0-9a-f-]{27}$/i,
        '',
      ),
    };
    if (index === 0) return [instanceId, { ...normalized, favorite: true }];
    if (index === 1) {
      return [instanceId, {
        ...normalized,
        is_caught: false,
        is_for_trade: false,
        is_wanted: true,
      }];
    }
    return [instanceId, normalized];
  }),
);
const performanceRouteOptions = {
  syncInstances: performanceInstances,
  userInstances: {
    instances: performanceInstances,
    username: signedInUser.username,
  },
};

const addMetric = (
  scenarioId: string,
  metric: string,
  value: number | null,
  sampleIndex: number,
  options: Pick<MetricSample, 'unit' | 'direction' | 'diagnostic'>,
) => {
  if (value == null || !Number.isFinite(value) || value < 0) return;
  samples.push({ scenarioId, metric, value, sampleIndex, ...options });
};

const installBrowserProbe = async (page: Page) => {
  await page.addInitScript(() => {
    const state = {
      frameTimes: [] as number[],
      longTasks: [] as number[],
      largestContentfulPaint: null as number | null,
      lastInputAt: null as number | null,
      lastPointerDownAt: null as number | null,
      measurementStartedAt: 0,
    };
    Object.defineProperty(window, '__performanceParityProbe', {
      configurable: true,
      value: state,
    });
    document.addEventListener('pointerdown', () => {
      state.lastPointerDownAt = performance.now();
    }, { capture: true });
    // Native interaction traces begin in their Pressable/TextInput handler.
    // Use the corresponding DOM activation event for like-for-like software
    // response latency; pointer-down additionally remains available for the
    // one explicit touch-to-motion contract.
    document.addEventListener('click', () => {
      state.lastInputAt = performance.now();
    }, { capture: true });
    document.addEventListener('input', () => {
      state.lastInputAt = performance.now();
    }, { capture: true });
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) state.longTasks.push(entry.duration);
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Long Task timing is Chromium-only and remains zero when unavailable.
    }
    try {
      new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) state.largestContentfulPaint = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP is diagnostic and optional.
    }
    const frame = (timestamp: number) => {
      state.frameTimes.push(timestamp);
      if (state.frameTimes.length > 2_000) state.frameTimes.shift();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
};

const setAuthAndTheme = async (
  page: Page,
  auth: ContractRoute['auth'],
  theme: 'dark' | 'light',
) => {
  await page.addInitScript(({ activeTheme, authState, user }) => {
    localStorage.clear();
    localStorage.setItem('isLightMode', String(activeTheme === 'light'));
    if (authState === 'signed-in') localStorage.setItem('user', JSON.stringify(user));
  }, { activeTheme: theme, authState: auth, user: signedInUser });
};

const seedPerformanceInstances = async (context: BrowserContext) => {
  const page = await context.newPage();
  await page.route('**/__performance-seed', (route) => route.fulfill({
    body: '<!doctype html><title>performance seed</title>',
    contentType: 'text/html',
    status: 200,
  }));
  try {
    await page.goto(`${webBaseUrl}/__performance-seed`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((instances) => new Promise<void>((resolveSeed, rejectSeed) => {
      const request = indexedDB.open('instancesDB', 5);
      request.onerror = () => rejectSeed(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('instances')) {
          db.createObjectStore('instances', { keyPath: 'instance_id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('instances', 'readwrite');
        const store = transaction.objectStore('instances');
        store.clear();
        for (const instance of Object.values(instances)) store.put(instance);
        transaction.oncomplete = () => {
          db.close();
          resolveSeed();
        };
        transaction.onerror = () => {
          db.close();
          rejectSeed(transaction.error);
        };
      };
    }), performanceInstances);
  } finally {
    await page.close();
  }
};

const waitUntilVisuallyReady = async (page: Page) => {
  await page.locator('#root').waitFor({ state: 'visible', timeout: 30_000 });
  // A root with a heading is not necessarily a ready route: several Vite
  // screens intentionally reveal their shell while collection/tool queries
  // are still resolving. Wait for the deterministic fixture traffic to go
  // quiet before evaluating loading surfaces and taking the paint snapshot.
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    const overlay = document.querySelector('.app-loading-overlay');
    const content = root?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const pendingStatus = Array.from(document.querySelectorAll('[role="status"]')).some(
      (element) => /^(Loading|Preparing|Opening|Syncing)\b/i.test(
        element.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      ),
    );
    return !overlay && !pendingStatus && content.length >= 12;
  }, null, { timeout: 30_000 });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
};

const resetBrowserProbe = async (page: Page) => page.evaluate(() => {
  const probe = (window as Window & {
    __performanceParityProbe?: {
      frameTimes: number[];
      longTasks: number[];
      largestContentfulPaint: number | null;
      measurementStartedAt: number;
    };
  }).__performanceParityProbe;
  if (!probe) return;
  probe.frameTimes = [];
  probe.longTasks = [];
  probe.largestContentfulPaint = null;
  probe.measurementStartedAt = performance.now();
});

const takeSnapshot = async (page: Page): Promise<BrowserSnapshot> => page.evaluate(() => {
  const probe = (window as Window & {
    __performanceParityProbe?: {
      frameTimes: number[];
      longTasks: number[];
      largestContentfulPaint: number | null;
      measurementStartedAt: number;
    };
  }).__performanceParityProbe;
  const measurementStartedAt = probe?.measurementStartedAt ?? 0;
  const frameGaps = (probe?.frameTimes ?? []).slice(1).map(
    (timestamp, index) => timestamp - (probe?.frameTimes[index] ?? timestamp),
  );
  const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint').at(-1);
  const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
  return {
    routeReadyMs: performance.now() - measurementStartedAt,
    mainThreadBlockingMs: (probe?.longTasks ?? []).reduce(
      (total, duration) => total + Math.max(0, duration - 50),
      0,
    ),
    maxFrameGapMs: frameGaps.length ? Math.max(...frameGaps) : 0,
    firstContentfulPaintMs: firstContentfulPaint && firstContentfulPaint.startTime >= measurementStartedAt
      ? firstContentfulPaint.startTime - measurementStartedAt
      : null,
    largestContentfulPaintMs: probe?.largestContentfulPaint != null
      ? Math.max(0, probe.largestContentfulPaint - measurementStartedAt)
      : null,
    transferSizeBytes: performance.getEntriesByType('resource').reduce(
      (total, entry) => total + (
        entry.startTime >= measurementStartedAt
          ? (entry as PerformanceResourceTiming).transferSize || 0
          : 0
      ),
      0,
    ),
    domNodeCount: document.getElementsByTagName('*').length,
    jsHeapBytes: memory?.usedJSHeapSize ?? null,
  };
});

const recordRouteSnapshot = (
  route: ContractRoute,
  snapshot: BrowserSnapshot,
  sampleIndex: number,
) => {
  addMetric(route.id, 'route_ready_ms', snapshot.routeReadyMs, sampleIndex, {
    direction: 'lower', unit: 'ms',
  });
  addMetric(route.id, 'main_thread_blocking_ms', snapshot.mainThreadBlockingMs, sampleIndex, {
    direction: 'lower', unit: 'ms',
  });
  addMetric(route.id, 'max_frame_gap_ms', snapshot.maxFrameGapMs, sampleIndex, {
    direction: 'lower', unit: 'ms',
  });
  addMetric(route.id, 'first_contentful_paint_ms', snapshot.firstContentfulPaintMs, sampleIndex, {
    diagnostic: true, direction: 'lower', unit: 'ms',
  });
  addMetric(route.id, 'largest_contentful_paint_ms', snapshot.largestContentfulPaintMs, sampleIndex, {
    diagnostic: true, direction: 'lower', unit: 'ms',
  });
  addMetric(route.id, 'transfer_size_bytes', snapshot.transferSizeBytes, sampleIndex, {
    diagnostic: true, direction: 'lower', unit: 'bytes',
  });
  addMetric(route.id, 'dom_node_count', snapshot.domNodeCount, sampleIndex, {
    diagnostic: true, direction: 'lower', unit: 'count',
  });
  addMetric(route.id, 'js_heap_bytes', snapshot.jsHeapBytes, sampleIndex, {
    diagnostic: true, direction: 'lower', unit: 'bytes',
  });
};

const inputLatency = async (page: Page, start: 'activation' | 'pointerdown' = 'activation') => page.evaluate((inputStart) => {
  const probe = (window as Window & {
    __performanceParityProbe?: {
      lastInputAt: number | null;
      lastPointerDownAt: number | null;
    };
  }).__performanceParityProbe;
  const startedAt = inputStart === 'pointerdown'
    ? probe?.lastPointerDownAt
    : probe?.lastInputAt;
  return startedAt == null ? null : performance.now() - startedAt;
}, start);

const createMeasuredPage = async (
  context: BrowserContext,
  auth: ContractRoute['auth'],
  theme: 'dark' | 'light',
) => {
  const page = await context.newPage();
  await installE2eRoutes(page, performanceRouteOptions);
  await setAuthAndTheme(page, auth, theme);
  await installBrowserProbe(page);
  return page;
};

const recordInteraction = async (
  page: Page,
  scenarioId: string,
  sampleIndex: number,
  start: 'activation' | 'pointerdown' = 'activation',
) => {
  const latency = await inputLatency(page, start);
  addMetric(scenarioId, 'interaction_ready_ms', latency, sampleIndex, {
    direction: 'lower', unit: 'ms',
  });
};

const collectSharedInteractions = async (
  context: BrowserContext,
  sampleIndex: number,
) => {
  const home = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await home.goto('/', { waitUntil: 'domcontentloaded' });
    await waitUntilVisuallyReady(home);
    await home.getByRole('button', { name: 'Action Menu', exact: true }).click();
    await home.getByRole('dialog', { name: 'Quick navigation' }).waitFor({ state: 'visible' });
    await recordInteraction(home, 'interaction.action-menu.open', sampleIndex);

    const theme = home.locator('.action-menu-overlay .switch');
    await theme.click();
    await expect(home.locator('html')).toHaveAttribute('data-theme', 'light');
    await recordInteraction(home, 'interaction.theme.toggle', sampleIndex);
  } finally {
    await home.close();
  }

  const collection = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await openCaughtPokemonList(collection, performanceRouteOptions);

    const search = collection.getByLabel('Search Pokémon', { exact: true });
    await search.click();
    await collection.locator('.search-menu').waitFor({ state: 'visible' });
    await recordInteraction(collection, 'interaction.collection.search-open', sampleIndex);

    await collection.locator('.filter-item').filter({ hasText: /^Shiny$/ }).click();
    await collection.locator('.search-menu').waitFor({ state: 'detached' });
    await collection.locator('.pokemon-card').first().waitFor({ state: 'visible' });
    await recordInteraction(collection, 'interaction.collection.filter', sampleIndex);
    await recordInteraction(collection, 'interaction.collection.query-result', sampleIndex);
  } finally {
    await collection.close();
  }

  const queryCollection = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await openPokemonPage(queryCollection, performanceRouteOptions);
    const querySearch = queryCollection.getByLabel('Search Pokémon', { exact: true });
    await querySearch.fill('Bulbasaur');
    await queryCollection.getByRole('button', { name: /Select Bulbasaur/i }).first()
      .waitFor({ state: 'visible' });
    await recordInteraction(queryCollection, 'interaction.collection.typed-query', sampleIndex);
    await queryCollection.locator('.evo-line-checkbox').click();
    await queryCollection.getByRole('button', { name: /Select Ivysaur/i }).first()
      .waitFor({ state: 'visible' });
    await recordInteraction(queryCollection, 'interaction.collection.evolution-result', sampleIndex);
  } finally {
    await queryCollection.close();
  }

  const sortCollection = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await openPokemonPage(sortCollection, performanceRouteOptions);
    await sortCollection.locator('.sort-button').first().click();
    await sortCollection.locator('.sort-menu-overlay.visible').waitFor({ state: 'visible' });
    await recordInteraction(sortCollection, 'interaction.collection.sort-open', sampleIndex);
    await sortCollection.locator('.sort-menu-overlay .sort-type-button')
      .filter({ hasText: 'NAME' }).click();
    await sortCollection.locator('.sort-menu-overlay').waitFor({ state: 'detached' });
    await expect(sortCollection.locator('.sort-button-img')).toHaveAttribute('alt', 'NAME');
    await recordInteraction(sortCollection, 'interaction.collection.sort-result', sampleIndex);
  } finally {
    await sortCollection.close();
  }

  const tagCollection = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await openCaughtPokemonList(tagCollection, performanceRouteOptions);
    await tagCollection.getByText('TAGS', { exact: true }).click();
    await tagCollection.locator('.tag-item[data-tag="Caught"]').waitFor({ state: 'visible' });
    await tagCollection.locator('.tag-item[data-tag="Caught"]').click();
    await tagCollection.locator('.toggle-text.active').filter({ hasText: 'Pokémon' })
      .waitFor({ state: 'visible' });
    await recordInteraction(
      tagCollection,
      'interaction.collection.tag-slide',
      sampleIndex,
      'pointerdown',
    );
    await tagCollection.locator('.pokemon-card').first().waitFor({ state: 'visible' });
    await recordInteraction(tagCollection, 'interaction.collection.tag-result', sampleIndex);

    await tagCollection.getByRole('button', { name: 'Clear Caught tag filter', exact: true }).click();
    await tagCollection.locator('.modal-overlay').waitFor({ state: 'visible' });
    await recordInteraction(tagCollection, 'interaction.collection.clear-tag-dialog', sampleIndex);
  } finally {
    await tagCollection.close();
  }

  const organizer = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    await openPokemonPage(organizer, performanceRouteOptions);
    await organizer.locator('.pokemon-card').first().click();
    await organizer.locator('.highlight-action-container').waitFor({ state: 'visible' });
    await recordInteraction(organizer, 'interaction.collection.selection', sampleIndex);
    await organizer.getByRole('button', { name: 'Add (1)', exact: true }).click();
    await organizer.locator('.pokemon-organizer').waitFor({ state: 'visible' });
    await recordInteraction(organizer, 'interaction.collection.organizer', sampleIndex);
  } finally {
    await organizer.close();
  }

  const instance = await createMeasuredPage(context, 'signed-in', 'dark');
  try {
    const { firstCaughtCard } = await openCaughtPokemonList(instance, performanceRouteOptions);
    await firstCaughtCard.click();
    const overlay = instance.locator('.instance-overlay.caught-mode');
    await overlay.waitFor({ state: 'visible' });
    const initialText = await overlay.textContent() ?? '';
    await instance.getByRole('button', { name: 'Next Pokemon', exact: true }).click();
    await expect.poll(() => overlay.textContent()).not.toBe(initialText);
    await recordInteraction(instance, 'interaction.instance.navigate', sampleIndex * 2);
    await instance.getByRole('button', { name: 'Previous Pokemon', exact: true }).click();
    await expect.poll(() => overlay.textContent()).toBe(initialText);
    await recordInteraction(instance, 'interaction.instance.navigate', sampleIndex * 2 + 1);
  } finally {
    await instance.close();
  }
};

const waitForHttp = async (url: string, timeoutMs = 20_000) => {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw lastError ?? new Error(`Timed out waiting for ${url}`);
};

const prepareAndroidChrome = async () => {
  if (!androidDeviceId) {
    throw new Error('POKEGONEXUS_ANDROID_DEVICE_ID is required for physical-android performance.');
  }
  const deviceType = execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'getprop', 'ro.kernel.qemu',
  ], { encoding: 'utf8' }).trim();
  if (deviceType === '1' || androidDeviceId.startsWith('emulator-')) {
    throw new Error(`Physical performance evidence cannot use emulator ${androidDeviceId}.`);
  }
  const port = Number(process.env.E2E_PORT ?? 3100);
  execFileSync(adbPath, ['-s', androidDeviceId, 'reverse', `tcp:${port}`, `tcp:${port}`]);
  execFileSync(adbPath, [
    '-s', androidDeviceId, 'forward', 'tcp:9222', 'localabstract:chrome_devtools_remote',
  ]);
  execFileSync(adbPath, ['-s', androidDeviceId, 'shell', 'am', 'force-stop', androidChromePackage]);
  execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'am', 'start',
    '-a', 'android.intent.action.VIEW',
    '-d', `http://127.0.0.1:${port}/`,
    androidChromePackage,
  ]);
  await waitForHttp(`${androidCdpUrl}/json/version`);
  execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'dumpsys', 'gfxinfo', androidChromePackage, 'reset',
  ]);
};

const parseFrameStats = (text: string) => {
  const lines = text.split(/\r?\n/);
  const frames: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith('Flags,')) continue;
    const headers = lines[index].split(',');
    const intendedIndex = headers.indexOf('IntendedVsync');
    const completedIndex = headers.indexOf('FrameCompleted');
    if (intendedIndex < 0 || completedIndex < 0) continue;
    for (const row of lines.slice(index + 1)) {
      if (row === '---PROFILEDATA---') break;
      if (!/^\d+,/.test(row)) continue;
      const values = row.split(',').map(Number);
      if (values[0] !== 0) continue;
      const duration = (values[completedIndex] - values[intendedIndex]) / 1_000_000;
      if (Number.isFinite(duration) && duration >= 0 && duration < 10_000) frames.push(duration);
    }
  }
  return frames;
};

const collectAndroidChromeSystemMetrics = () => {
  if (performanceProfile !== 'physical-android' || !androidDeviceId) return;
  const frameText = execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'dumpsys', 'gfxinfo', androidChromePackage, 'framestats',
  ], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const frames = parseFrameStats(frameText);
  const displayText = execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'dumpsys', 'display',
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const refreshHz = Number(displayText.match(/refreshRate[=: ]+([\d.]+)/)?.[1] ?? 60);
  const frameBudgetMs = Number.isFinite(refreshHz) && refreshHz > 0 ? 1_000 / refreshHz : 16.67;
  if (frames.length) {
    const sorted = [...frames].sort((left, right) => left - right);
    const p95 = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
    addMetric('global.runtime', 'frame_time_p95_ms', p95, 0, {
      direction: 'lower', unit: 'ms',
    });
    addMetric(
      'global.runtime',
      'janky_frames_percent',
      frames.filter((duration) => duration > frameBudgetMs).length / frames.length * 100,
      0,
      { direction: 'lower', unit: 'percent' },
    );
  }
  const memoryText = execFileSync(adbPath, [
    '-s', androidDeviceId, 'shell', 'dumpsys', 'meminfo', androidChromePackage,
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const totalPss = memoryText.match(/TOTAL PSS:\s*([\d,]+)\s*(?:KB|kB)?/i)
    ?? memoryText.match(/^\s*TOTAL\s+([\d,]+)/m);
  if (totalPss) {
    addMetric(
      'global.runtime',
      'memory_pss_bytes',
      Number(totalPss[1].replaceAll(',', '')) * 1024,
      0,
      { direction: 'lower', unit: 'bytes' },
    );
  }
};

const writeReport = () => {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify({
    schemaVersion: 1,
    implementation: 'vite',
    profile: performanceProfile,
    createdAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    environment: {
      browser: 'chromium',
      project: 'mobile-chrome',
      viewport: '412x915',
      repetitions,
      androidDeviceId: androidDeviceId || null,
      deviceIdentity: androidDeviceId || null,
      workloadId: 'canonical-performance-fixtures-v1',
      catalogEntries: performanceCatalogEntries,
      instanceEntries: Object.keys(performanceInstances).length,
      pvpEntries: 5,
    },
    samples,
  }, null, 2)}\n`);
};

test.describe('Vite performance parity report', () => {
  test.setTimeout(15 * 60_000);

  test('@parity-performance records every comparable route and shared interaction', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'The contract uses the Pixel Chromium viewport.');
    let ownedBrowser: Browser | null = null;
    let physicalContext: BrowserContext | null = null;
    if (performanceProfile === 'physical-android') {
      await prepareAndroidChrome();
      ownedBrowser = await chromium.connectOverCDP(androidCdpUrl);
      const [connectedContext] = ownedBrowser.contexts();
      if (!connectedContext) throw new Error('Android Chrome exposed no inspectable browser context.');
      physicalContext = connectedContext;
    } else {
      ownedBrowser = await chromium.launch({
        headless: true,
        ...(process.env.E2E_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.E2E_CHROMIUM_EXECUTABLE_PATH }
          : {}),
      });
    }
    const createContext = async (theme: 'dark' | 'light') => physicalContext
      ?? ownedBrowser!.newContext({
        colorScheme: theme,
        viewport: { height: 915, width: 412 },
      });
    try {
      for (let repetition = 0; repetition < repetitions; repetition += 1) {
        if (!workflowsOnly) {
          for (const [themeIndex, theme] of (['dark', 'light'] as const).entries()) {
            for (const auth of (['guest', 'signed-in'] as const)) {
              const routeContext = await createContext(theme);
              try {
                if (auth === 'signed-in') await seedPerformanceInstances(routeContext);
                for (const [routeIndex, route] of contract.routes.entries()) {
                  if (route.auth !== auth) continue;
                  if (routeFilter && !route.id.includes(routeFilter) && !route.vite.includes(routeFilter)) {
                    continue;
                  }
                  const page = await createMeasuredPage(routeContext, route.auth, theme);
                  try {
                    const warmPath = route.vite === '/about' ? '/faq' : '/about';
                    const response = await page.goto(warmPath, {
                      timeout: 60_000,
                      waitUntil: 'domcontentloaded',
                    });
                    expect(response?.ok(), `${warmPath} warm document response`).toBe(true);
                    await waitUntilVisuallyReady(page);
                    await resetBrowserProbe(page);
                    await page.evaluate((destination) => {
                      window.history.pushState({}, '', destination);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }, route.vite);
                    await waitUntilVisuallyReady(page);
                    recordRouteSnapshot(
                      route,
                      await takeSnapshot(page),
                      repetition * contract.routes.length * 2 + themeIndex * contract.routes.length + routeIndex,
                    );
                  } finally {
                    await page.close();
                  }
                }
                if (!routeFilter && auth === 'signed-in' && theme === 'dark') {
                  await collectSharedInteractions(routeContext, repetition);
                }
              } finally {
                if (!physicalContext) await routeContext.close();
              }
            }
          }
        }
        if (workflowsOnly) {
          const interactionContext = await createContext('dark');
          try {
            await seedPerformanceInstances(interactionContext);
            await collectSharedInteractions(interactionContext, repetition);
          } finally {
            if (!physicalContext) await interactionContext.close();
          }
        }
      }
    } finally {
      collectAndroidChromeSystemMetrics();
      writeReport();
      if (performanceProfile !== 'physical-android') {
        await ownedBrowser?.close();
      }
    }
    const measuredRouteCount = contract.routes.filter((route) => (
      !routeFilter || route.id.includes(routeFilter) || route.vite.includes(routeFilter)
    )).length;
    expect(samples.length).toBeGreaterThan(workflowsOnly
      ? repetitions
      : measuredRouteCount * repetitions * 2);
  });
});

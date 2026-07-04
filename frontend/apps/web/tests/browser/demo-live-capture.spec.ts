import fs from 'node:fs';
import path from 'node:path';

import { expect, test, type Locator, type Page } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';

const liveDemoMediaDir = path.resolve(process.cwd(), '.artifacts/demo-media-live');
const demoUsername = process.env.POKEGONEXUS_DEMO_USERNAME ?? '';
const demoPassword = process.env.POKEGONEXUS_DEMO_PASSWORD ?? '';

type ThemeMode = 'dark' | 'light';
type ViewportMode = 'desktop' | 'mobile';

type BlockedMutation = {
  method: string;
  url: string;
};

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const captureThemes: ThemeMode[] = ['dark', 'light'];
const captureViewports: Record<ViewportMode, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

test.use({
  screenshot: 'off',
  trace: 'off',
  video: 'off',
});

function formatUrlForReport(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return rawUrl;
  }
}

function mediaName(theme: ThemeMode, surface: string, viewport: ViewportMode) {
  return `${theme}-${surface}-${viewport}`;
}

async function setThemeMode(page: Page, theme: ThemeMode) {
  await page.evaluate((mode) => {
    const isLightMode = mode === 'light';
    window.localStorage.setItem('isLightMode', JSON.stringify(isLightMode));
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
    document.documentElement.style.colorScheme = isLightMode ? 'light' : 'dark';
  }, theme);
}

async function prepareCaptureContext(page: Page, theme: ThemeMode, viewport: ViewportMode) {
  await page.setViewportSize(captureViewports[viewport]);
  await setThemeMode(page, theme);
}

function isAllowedCredentialRequest(method: string, rawUrl: string) {
  if (method !== 'POST') return false;

  try {
    const { pathname } = new URL(rawUrl);
    return /\/api\/auth\/(?:login|refresh)\/?$/.test(pathname);
  } catch {
    return false;
  }
}

function isTelemetryRequest(method: string, rawUrl: string) {
  if (method !== 'POST') return false;

  try {
    const { pathname } = new URL(rawUrl);
    return pathname === '/cdn-cgi/rum';
  } catch {
    return false;
  }
}

function isUserOverviewRequest(rawUrl: string) {
  try {
    const { pathname } = new URL(rawUrl);
    return /\/api\/users\/(?:users\/)?[^/]+\/overview\/?$/.test(pathname);
  } catch {
    return false;
  }
}

async function installReadOnlyNetworkGuard(page: Page) {
  const blockedMutations: BlockedMutation[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = request.url();

    if (isTelemetryRequest(method, url)) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (readOnlyMethods.has(method) || isAllowedCredentialRequest(method, url)) {
      await route.continue();
      return;
    }

    blockedMutations.push({
      method,
      url: formatUrlForReport(url),
    });
    await route.abort('blockedbyclient');
  });

  return blockedMutations;
}

async function clickIfVisible(locator: Locator, timeout = 2_000) {
  if (await locator.isVisible({ timeout }).catch(() => false)) {
    await hideToastNotifications(locator.page());
    await locator.click({ timeout: Math.max(timeout, 5_000) });
    return true;
  }
  return false;
}

async function hideToastNotifications(page: Page) {
  await page.evaluate(() => {
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('.Toastify'))) {
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
    }
  });
}

async function waitForAppSettled(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
  await expect(page.locator('.app-loading-overlay')).toHaveCount(0, { timeout: 30_000 });
}

async function waitForPokemonCatalogReady(page: Page, timeout = 60_000) {
  try {
    await page.waitForFunction(
      () => {
        const timestamp = Number(window.localStorage.getItem('variantsTimestamp') ?? '0');
        return Number.isFinite(timestamp) && timestamp > 0;
      },
      undefined,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

async function waitForAnyVisible(page: Page, locators: Locator[], timeout = 30_000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const locator of locators) {
      if (await locator.first().isVisible({ timeout: 250 }).catch(() => false)) {
        return locator.first();
      }
    }
    await page.waitForTimeout(250);
  }

  throw new Error('Timed out waiting for expected live-capture UI state.');
}

async function waitForVisibleImagesReady(page: Page, timeout = 30_000) {
  await page
    .waitForFunction(
      () => {
        const visibleImages = Array.from(document.images).filter((image) => {
          const rect = image.getBoundingClientRect();
          const style = window.getComputedStyle(image);

          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            rect.width > 2 &&
            rect.height > 2 &&
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= window.innerHeight &&
            rect.left <= window.innerWidth
          );
        });

        return visibleImages.every((image) => image.complete);
      },
      undefined,
      { timeout },
    )
    .catch(() => {});
  await page.waitForTimeout(500);
}

async function waitForCollectionMediaReady(page: Page, timeout = 90_000) {
  await page.evaluate(() => {
    for (const image of Array.from(document.querySelectorAll<HTMLImageElement>('.pokemon-card img'))) {
      image.loading = 'eager';
      image.decoding = 'sync';
    }
  });

  await page.waitForFunction(
    () => {
      const isInViewport = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 2 &&
          rect.height > 2 &&
          rect.bottom >= 0 &&
          rect.right >= 0 &&
          rect.top <= window.innerHeight &&
          rect.left <= window.innerWidth
        );
      };

      const visibleCards = Array.from(document.querySelectorAll<HTMLElement>('.pokemon-card'))
        .filter(isInViewport);
      const visibleCardImages = visibleCards.flatMap((card) =>
        Array.from(
          card.querySelectorAll<HTMLImageElement>(
            '.location-backdrop, .pokemon-image, .lucky-backdrop, .max-badge, .purified-badge-image',
          ),
        ).filter(isInViewport),
      );

      return visibleCardImages.every(
        (image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      );
    },
    undefined,
    { timeout },
  );

  await page.evaluate(async () => {
    const cssUrlPattern = /url\((['"]?)(.*?)\1\)/g;
    const isInViewport = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 2 &&
        rect.height > 2 &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= window.innerHeight &&
        rect.left <= window.innerWidth
      );
    };
    const decodeImage = async (image: HTMLImageElement) => {
      if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
        await image.decode().catch(() => {});
      }
    };
    const preloadUrl = async (url: string) => {
      const image = new Image();
      image.src = url;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Could not preload ${url}`));
      });
      await image.decode().catch(() => {});
    };

    const visibleCards = Array.from(document.querySelectorAll<HTMLElement>('.pokemon-card'))
      .filter(isInViewport);
    const visibleImages = visibleCards.flatMap((card) =>
      Array.from(card.querySelectorAll<HTMLImageElement>('img')).filter(isInViewport),
    );
    const cssBackgroundUrls = visibleCards.flatMap((card) =>
      Array.from(card.querySelectorAll<HTMLElement>('*')).flatMap((element) => {
        const urls: string[] = [];
        const backgroundImage = window.getComputedStyle(element).backgroundImage;
        let match: RegExpExecArray | null;
        while ((match = cssUrlPattern.exec(backgroundImage)) !== null) {
          if (match[2]) urls.push(match[2]);
        }
        return urls;
      }),
    );

    await Promise.all([
      ...visibleImages.map(decodeImage),
      ...Array.from(new Set(cssBackgroundUrls)).map(preloadUrl),
    ]);
  });
  await page.waitForTimeout(750);
}

async function isPokemonPanelCentered(page: Page) {
  return await page
    .evaluate(() => {
      const pokemonPanel = document.querySelectorAll<HTMLElement>('.slider-panel')[1];
      if (!pokemonPanel) return false;

      const panelRect = pokemonPanel.getBoundingClientRect();
      return Math.abs(panelRect.left) <= 8;
    })
    .catch(() => false);
}

async function forcePokemonPanelCentered(page: Page) {
  await page.evaluate(() => {
    const slider = document.querySelector<HTMLElement>('.view-slider');
    const pokemonPanel = document.querySelectorAll<HTMLElement>('.slider-panel')[1];
    if (!slider || !pokemonPanel) return;

    const transform = window.getComputedStyle(slider).transform;
    const currentX = transform && transform !== 'none'
      ? new DOMMatrixReadOnly(transform).m41
      : 0;
    const panelLeft = pokemonPanel.getBoundingClientRect().left;
    const nextX = Math.round(currentX - panelLeft);

    slider.style.setProperty('transition', 'none', 'important');
    slider.style.setProperty('transform', `translate3d(${nextX}px, 0, 0)`, 'important');
  });
}

async function centerPokemonPanel(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await isPokemonPanelCentered(page)) {
      await page.waitForTimeout(250);
      return;
    }

    await hideToastNotifications(page);
    await page.getByText('Pokémon', { exact: true }).first().click({ timeout: 5_000 }).catch(
      async () => {
        await page.locator('.controls-row .toggle-col').nth(1).click({ timeout: 5_000 });
      },
    );
    await page.waitForTimeout(650);
  }

  await forcePokemonPanelCentered(page);
  await page.waitForTimeout(350);
}

async function capture(page: Page, name: string, options: Parameters<Page['screenshot']>[0] = {}) {
  await page.mouse.move(4, 4);
  await page.waitForTimeout(100);
  await hideToastNotifications(page);
  await page.evaluate(() => {
    for (const button of Array.from(document.querySelectorAll('button'))) {
      if (button.textContent?.includes('Perf telemetry')) {
        const panel = button.parentElement;
        if (panel) {
          panel.style.display = 'none';
        }
      }
    }
  });
  await waitForVisibleImagesReady(page);

  await page.screenshot({
    path: path.join(liveDemoMediaDir, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
    ...options,
  });
}

async function loginWithDemoAccount(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByPlaceholder('Username or Email')).toBeVisible({ timeout: 30_000 });

  await page.getByPlaceholder('Username or Email').fill(demoUsername);
  await page.getByPlaceholder('Password').fill(demoPassword);

  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      /\/api\/auth\/login\/?$/.test(new URL(response.url()).pathname),
    { timeout: 30_000 },
  );
  const overviewResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' && isUserOverviewRequest(response.url()),
    { timeout: 60_000 },
  );

  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByPlaceholder('Password').fill('').catch(() => {});
  const response = await loginResponse;
  expect(response.ok(), `login request failed with ${response.status()}`).toBe(true);
  const overview = await overviewResponse;
  expect(overview.ok(), `overview request failed with ${overview.status()}`).toBe(true);

  await Promise.race([
    page.getByText(/successfully logged in/i).waitFor({ state: 'visible', timeout: 45_000 }),
    page.getByRole('link', { name: 'Account' }).waitFor({ state: 'visible', timeout: 45_000 }),
    page.waitForFunction(
      () => {
        const rawUser = window.localStorage.getItem('user');
        if (!rawUser) return false;

        try {
          const user = JSON.parse(rawUser) as { username?: unknown };
          return typeof user.username === 'string' && user.username.length > 0;
        } catch {
          return false;
        }
      },
      undefined,
      { timeout: 45_000 },
    ),
  ]);
}

async function seedStoredLocationFromAccount(page: Page) {
  return await page.evaluate(() => {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) return false;

    try {
      const user = JSON.parse(rawUser) as {
        coordinates?: { latitude?: unknown; longitude?: unknown };
        location?: { latitude?: unknown; longitude?: unknown };
      };
      const coordinates = user.coordinates ?? user.location;
      const latitude = Number(coordinates?.latitude);
      const longitude = Number(coordinates?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      window.localStorage.setItem('location', JSON.stringify({ latitude, longitude }));
      return true;
    } catch {
      return false;
    }
  });
}

async function chooseCaughtTag(page: Page) {
  await clickIfVisible(page.getByText('TAGS', { exact: true }), 5_000);
  await clickIfVisible(page.locator('.tag-item[data-tag="Caught"]'), 10_000);
  await waitForAppSettled(page);
}

async function sortCollectionByFavorites(page: Page) {
  const readSortState = () =>
    page.locator('.sort-button').first().evaluate((button) => {
      const sortType = button.querySelector<HTMLImageElement>('.sort-button-img')?.alt ?? '';
      const sortArrow = button.querySelector<HTMLImageElement>('.sort-arrow-img');
      const arrowStyle = sortArrow?.getAttribute('style') ?? '';
      const arrowTransform = sortArrow ? window.getComputedStyle(sortArrow).transform : '';

      return {
        sortType,
        isDescending:
          arrowStyle.includes('180deg') ||
          arrowTransform.startsWith('matrix(-1') ||
          arrowTransform.startsWith('matrix3d(-1'),
      };
    });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await readSortState().catch(() => ({ sortType: '', isDescending: false }));
    if (state.sortType === 'FAVORITE' && state.isDescending) {
      return;
    }

    const sortButton = page.locator('.sort-button').first();
    await expect(sortButton).toBeVisible({ timeout: 15_000 });
    await hideToastNotifications(page);
    await sortButton.click({ timeout: 10_000 });

    await expect(page.locator('.sort-menu-overlay')).toBeVisible({ timeout: 10_000 });
    await page
      .locator('.sort-menu-overlay .sort-type-button')
      .filter({ hasText: 'FAVORITE' })
      .click({ timeout: 10_000 });
    await expect(page.locator('.sort-menu-overlay')).toHaveCount(0, { timeout: 15_000 });
    await waitForAppSettled(page);
  }

  throw new Error('Could not set collection sort to FAVORITE descending.');
}

async function waitForCollectionCardsOrEmpty(page: Page) {
  await waitForAnyVisible(page, [
    page.locator('.pokemon-card').first(),
    page.getByText(/No Pok[eé]mon in this (?:list|tag)/i).first(),
    page.getByRole('button', { name: /Inventory 0/i }),
  ], 45_000);
}

async function ensureCollectionContentInViewport(page: Page) {
  const cardInViewport = await page
    .locator('.pokemon-card')
    .first()
    .evaluate((card) => {
      const rect = card.getBoundingClientRect();
      return rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0;
    })
    .catch(() => false);

  if (!cardInViewport) {
    await forcePokemonPanelCentered(page);
    await page.waitForTimeout(350);
  }
}

async function getPreferredRaikouCard(page: Page) {
  const cards = page.locator('.pokemon-card');
  await expect(
    cards.first(),
    'Expected AdamZilla to have a caught Raikou for the live demo overlay',
  ).toBeVisible({ timeout: 45_000 });

  const preferredIndex = await cards.evaluateAll((elements) => {
    const hasShinyShadowImage = (element: Element) =>
      Array.from(element.querySelectorAll<HTMLImageElement>('img')).some((image) => {
        const src = image.currentSrc || image.src || '';
        return /shiny[_-]shadow/i.test(src);
      });
    const looksLikeRaikou = (element: Element) => {
      const text = element.textContent ?? '';
      const imageText = Array.from(element.querySelectorAll<HTMLImageElement>('img'))
        .map((image) => `${image.alt} ${image.currentSrc || image.src}`)
        .join(' ');

      return /raikou|pokemon_243|shiny_shadow_pokemon_243/i.test(`${text} ${imageText}`);
    };

    return elements.findIndex(
      (element) => looksLikeRaikou(element) && hasShinyShadowImage(element),
    );
  });

  return preferredIndex >= 0 ? cards.nth(preferredIndex) : cards.first();
}

async function openShinyShadowRaikouOverlay(page: Page) {
  const searchInput = page.locator('.search-input').first();
  await expect(searchInput).toBeVisible({ timeout: 15_000 });
  await searchInput.fill('raikou');
  await waitForAppSettled(page);

  await getPreferredRaikouCard(page);
  await waitForVisibleImagesReady(page, 45_000);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const raikouCard = await getPreferredRaikouCard(page);
    try {
      await raikouCard.click({ timeout: 10_000 });
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await page.waitForTimeout(500);
    }
  }

  await expect(page.locator('.instance-overlay')).toBeVisible({ timeout: 15_000 });
  await waitForVisibleImagesReady(page, 45_000);
}

async function captureCollection(page: Page, theme: ThemeMode, viewport: ViewportMode) {
  await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);

  await chooseCaughtTag(page);
  await centerPokemonPanel(page);
  await sortCollectionByFavorites(page);
  await centerPokemonPanel(page);
  await waitForCollectionCardsOrEmpty(page);
  await ensureCollectionContentInViewport(page);
  await forcePokemonPanelCentered(page);
  await page.waitForTimeout(100);
  await waitForCollectionMediaReady(page);
  await capture(page, mediaName(theme, 'collection', viewport));

  await centerPokemonPanel(page);
  await ensureCollectionContentInViewport(page);
  await forcePokemonPanelCentered(page);
  await page.waitForTimeout(100);
  await openShinyShadowRaikouOverlay(page);
  await capture(page, mediaName(theme, 'instance-overlay', viewport));
  await clickIfVisible(page.getByRole('button', { name: 'Close' }), 5_000);
  await expect(page.locator('.instance-overlay')).toHaveCount(0, { timeout: 15_000 });
}

async function captureSearch(page: Page, theme: ThemeMode, viewport: ViewportMode) {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);
  await page.getByRole('button', { name: 'Pokemon' }).click();
  await expect(page.getByPlaceholder('Enter Pokemon name')).toBeVisible({ timeout: 30_000 });
  const catalogReady = await waitForPokemonCatalogReady(page);
  const listName = mediaName(theme, 'search-results-list', viewport);
  const mapName = mediaName(theme, 'search-results-map', viewport);

  await page.getByPlaceholder('Enter Pokemon name').fill('Pikachu');
  await clickIfVisible(page.getByRole('button', { name: 'Pikachu', exact: true }), 2_000);

  if (await seedStoredLocationFromAccount(page)) {
    await page.getByRole('button', { name: 'Use Current Location' }).click();
  } else {
    await page.getByPlaceholder('Enter location').fill('Vancouver');
    await clickIfVisible(page.getByText(/Vancouver/i).first(), 10_000);
  }

  await page.getByRole('button', { name: 'Search', exact: true }).click();
  if (!catalogReady) {
    await waitForAnyVisible(page, [
      page.getByText(/No Pokemon data found in the default store/i),
      page.getByText(/Use the Toolbar above/i),
    ], 10_000);
    await capture(page, listName);
    await capture(page, mapName);
    return;
  }

  await waitForAnyVisible(page, [
    page.locator('.list-view-container'),
    page.getByText('No Pokemon found matching your criteria.'),
    page.getByText(/No Pokemon data found in the default store/i),
    page.getByText(/Use the Toolbar above/i),
  ]);
  const hasSearchResults = await page.locator('.list-view-container').isVisible().catch(() => false);
  await capture(page, listName);

  if (hasSearchResults) {
    await page.getByRole('button', { name: 'Map view' }).click();
    await waitForAnyVisible(page, [page.locator('.ol-viewport')]);
    await page.waitForTimeout(1_200);
  }
  await capture(page, mapName);
}

test.describe('live demo media capture', () => {
  test.setTimeout(600_000);

  test.skip(process.env.DEMO_CAPTURE_LIVE !== '1', 'Only run through npm run capture:demo:live');
  test.skip(
    !demoUsername || !demoPassword,
    'Set POKEGONEXUS_DEMO_USERNAME and POKEGONEXUS_DEMO_PASSWORD to capture live media',
  );

  test('captures PokeGo Nexus surfaces with a real read-only demo account', async ({ page }, testInfo) => {
    fs.rmSync(liveDemoMediaDir, { recursive: true, force: true });
    fs.mkdirSync(liveDemoMediaDir, { recursive: true });
    const diagnostics = attachBrowserDiagnostics(page, testInfo);
    const blockedMutations = await installReadOnlyNetworkGuard(page);

    try {
      await loginWithDemoAccount(page);

      for (const theme of captureThemes) {
        for (const viewport of Object.keys(captureViewports) as ViewportMode[]) {
          await prepareCaptureContext(page, theme, viewport);
          await captureCollection(page, theme, viewport);
          await captureSearch(page, theme, viewport);
        }
      }
    } finally {
      await diagnostics.flush();
    }

    expect(
      blockedMutations,
      `live capture blocked unexpected account-mutating requests:\n${JSON.stringify(blockedMutations, null, 2)}`,
    ).toEqual([]);

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });
});

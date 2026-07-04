import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';
import ffmpegStaticPath from 'ffmpeg-static';

import { attachBrowserDiagnostics } from './support/diagnostics';

const liveDemoMediaDir = path.resolve(process.cwd(), '.artifacts/demo-media-live');
const liveDemoVideoDir = path.resolve(process.cwd(), '.artifacts/demo-video-live');
const demoUsername = process.env.POKEGONEXUS_DEMO_USERNAME ?? '';
const demoPassword = process.env.POKEGONEXUS_DEMO_PASSWORD ?? '';

type ThemeMode = 'dark' | 'light';
type ViewportMode = 'desktop' | 'mobile';
type VideoFlow = 'collection-overlay' | 'search-results';

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
const runLiveVideoCapture = process.env.DEMO_VIDEO_CAPTURE_LIVE === '1';
const videoFlows = runLiveVideoCapture
  ? parseModes<VideoFlow>(
      process.env.DEMO_VIDEO_FLOWS,
      ['collection-overlay', 'search-results'],
      ['collection-overlay', 'search-results'],
    )
  : [];
const videoThemes = runLiveVideoCapture
  ? parseModes<ThemeMode>(process.env.DEMO_VIDEO_THEMES, captureThemes, ['dark'])
  : [];
const videoViewports = runLiveVideoCapture
  ? parseModes<ViewportMode>(
      process.env.DEMO_VIDEO_VIEWPORTS,
      Object.keys(captureViewports) as ViewportMode[],
      ['desktop', 'mobile'],
    )
  : [];
const videoPauseMs = parsePositiveInteger(process.env.DEMO_VIDEO_PAUSE_MS, 2_500);
const videoActionPauseMs = parsePositiveInteger(process.env.DEMO_VIDEO_ACTION_PAUSE_MS, 650);
const videoFinalPauseMs = parsePositiveInteger(process.env.DEMO_VIDEO_FINAL_PAUSE_MS, 4_500);
const videoMaxDurationSeconds = parsePositiveNumber(process.env.DEMO_VIDEO_MAX_SECONDS, 19.8);
const videoTrimPrerollMs = parsePositiveInteger(process.env.DEMO_VIDEO_TRIM_PREROLL_MS, 150);

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

function videoName(theme: ThemeMode, flow: VideoFlow, viewport: ViewportMode) {
  return `${theme}-${flow}-${viewport}`;
}

function parseModes<T extends string>(
  rawValue: string | undefined,
  allowedValues: readonly T[],
  defaultValues: readonly T[],
) {
  if (!rawValue) return [...defaultValues];

  const allowed = new Set<string>(allowedValues);
  const values = rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const invalidValues = values.filter((value) => !allowed.has(value));

  if (invalidValues.length > 0) {
    throw new Error(
      `Invalid live demo video option(s): ${invalidValues.join(', ')}. ` +
        `Allowed values are: ${allowedValues.join(', ')}.`,
    );
  }

  return Array.from(new Set(values)) as T[];
}

function parsePositiveInteger(rawValue: string | undefined, fallback: number) {
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function parsePositiveNumber(rawValue: string | undefined, fallback: number) {
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  if (ffmpegStaticPath) {
    return ffmpegStaticPath;
  }

  return 'ffmpeg';
}

function formatSeconds(durationMs: number) {
  return (Math.max(0, durationMs) / 1_000).toFixed(3);
}

function videoTrimStart(recordingStartedAt: number) {
  return Math.max(0, Date.now() - recordingStartedAt - videoTrimPrerollMs);
}

function trimVideoClip(rawVideoPath: string, outputVideoPath: string, trimStartMs: number) {
  const ffmpegPath = resolveFfmpegPath();
  const result = spawnSync(
    ffmpegPath,
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      rawVideoPath,
      '-ss',
      formatSeconds(trimStartMs),
      '-t',
      String(videoMaxDurationSeconds),
      '-an',
      '-vf',
      'fps=30',
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '28',
      '-b:v',
      '0',
      '-row-mt',
      '1',
      outputVideoPath,
    ],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(
      [
        `Could not trim live demo video with ffmpeg at ${ffmpegPath}.`,
        `Raw video kept at: ${rawVideoPath}`,
        result.error ? `Error: ${result.error.message}` : '',
        result.stderr ? `stderr:\n${result.stderr}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
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

async function installVideoPresentationHelpers(context: BrowserContext, showCursor: boolean) {
  await context.addInitScript((options: { showCursor: boolean }) => {
    const styleId = 'live-demo-video-presentation-style';
    const cursorId = 'live-demo-video-cursor';
    const tapClassName = 'live-demo-mobile-tap';
    let lastCursorX = 24;
    let lastCursorY = 24;

    const updateCursor = () => {
      const cursor = document.getElementById(cursorId) as HTMLElement | null;
      if (!cursor) return;
      cursor.style.transform = `translate3d(${lastCursorX}px, ${lastCursorY}px, 0)`;
    };

    const ensurePresentation = () => {
      const root = document.documentElement;
      if (!root) return;

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .Toastify,
          .Toastify__toast-container,
          .Toastify__toast {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
          .app-loading-overlay {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
          #${cursorId} {
            background: #ffffff;
            clip-path: polygon(0 0, 0 21px, 6px 15px, 10px 24px, 14px 22px, 10px 13px, 18px 13px);
            filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.75));
            height: 24px;
            left: 0;
            pointer-events: none;
            position: fixed;
            top: 0;
            transition: transform 180ms ease, scale 120ms ease;
            width: 18px;
            z-index: 2147483647;
          }
          #${cursorId}.is-pressing {
            scale: 0.88;
          }
          .${tapClassName} {
            --tap-x: 0px;
            --tap-y: 0px;
            animation: live-demo-tap-ripple 720ms ease-out forwards;
            background: rgb(255 255 255 / 0.22);
            border: 2px solid rgb(255 255 255 / 0.92);
            border-radius: 999px;
            box-shadow:
              0 0 0 1px rgb(0 0 0 / 0.25),
              0 6px 18px rgb(0 0 0 / 0.28);
            height: 54px;
            left: 0;
            pointer-events: none;
            position: fixed;
            top: 0;
            transform: translate3d(calc(var(--tap-x) - 27px), calc(var(--tap-y) - 27px), 0) scale(0.58);
            width: 54px;
            z-index: 2147483647;
          }
          .${tapClassName}::after {
            background: rgb(255 255 255 / 0.92);
            border-radius: inherit;
            content: '';
            height: 10px;
            left: 50%;
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
          }
          @keyframes live-demo-tap-ripple {
            0% {
              opacity: 0;
              transform: translate3d(calc(var(--tap-x) - 27px), calc(var(--tap-y) - 27px), 0) scale(0.48);
            }
            16% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translate3d(calc(var(--tap-x) - 27px), calc(var(--tap-y) - 27px), 0) scale(1.12);
            }
          }
        `;
        (document.head ?? root).appendChild(style);
      }

      if (!options.showCursor) {
        document.getElementById(cursorId)?.remove();
        return;
      }

      if (!document.getElementById(cursorId)) {
        const cursor = document.createElement('div');
        cursor.id = cursorId;
        cursor.setAttribute('aria-hidden', 'true');
        (document.body ?? root).appendChild(cursor);
        updateCursor();
      }
    };

    const markCursorPressing = (isPressing: boolean) => {
      const cursor = document.getElementById(cursorId);
      cursor?.classList.toggle('is-pressing', isPressing);
    };

    window.addEventListener(
      'mousemove',
      (event) => {
        lastCursorX = event.clientX;
        lastCursorY = event.clientY;
        updateCursor();
      },
      true,
    );
    window.addEventListener('mousedown', () => markCursorPressing(true), true);
    window.addEventListener('mouseup', () => markCursorPressing(false), true);

    type DemoVideoWindow = Window & {
      __setLiveDemoCursor?: (x: number, y: number) => void;
      __showLiveDemoTap?: (x: number, y: number) => void;
    };
    (window as DemoVideoWindow).__setLiveDemoCursor = (x: number, y: number) => {
      lastCursorX = x;
      lastCursorY = y;
      ensurePresentation();
      updateCursor();
    };
    (window as DemoVideoWindow).__showLiveDemoTap = (x: number, y: number) => {
      if (options.showCursor) return;

      ensurePresentation();
      const tap = document.createElement('div');
      tap.className = tapClassName;
      tap.setAttribute('aria-hidden', 'true');
      tap.style.setProperty('--tap-x', `${x}px`);
      tap.style.setProperty('--tap-y', `${y}px`);
      (document.body ?? document.documentElement).appendChild(tap);

      const removeTap = () => tap.remove();
      tap.addEventListener('animationend', removeTap, { once: true });
      window.setTimeout(removeTap, 900);
    };

    ensurePresentation();
    document.addEventListener('DOMContentLoaded', ensurePresentation);
    new MutationObserver(ensurePresentation).observe(document, {
      childList: true,
      subtree: true,
    });
  }, { showCursor });
}

async function moveVideoCursorToLocator(locator: Locator) {
  const page = locator.page();
  const box = await locator.boundingBox();
  if (!box) return;

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(
    ({ nextX, nextY }) => {
      type DemoVideoWindow = Window & {
        __setLiveDemoCursor?: (x: number, y: number) => void;
      };
      (window as DemoVideoWindow).__setLiveDemoCursor?.(nextX, nextY);
    },
    { nextX: x, nextY: y },
  );
  await page.mouse.move(x, y, { steps: 16 });
  await page.waitForTimeout(220);
}

async function showVideoTapAtLocator(locator: Locator) {
  const page = locator.page();
  const box = await locator.boundingBox();
  if (!box) return;

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(
    ({ tapX, tapY }) => {
      type DemoVideoWindow = Window & {
        __showLiveDemoTap?: (x: number, y: number) => void;
      };
      (window as DemoVideoWindow).__showLiveDemoTap?.(tapX, tapY);
    },
    { tapX: x, tapY: y },
  );
  await page.waitForTimeout(120);
}

async function clickForVideo(locator: Locator, timeout = 10_000) {
  await expect(locator).toBeVisible({ timeout });
  await hideToastNotifications(locator.page());
  await moveVideoCursorToLocator(locator);
  await showVideoTapAtLocator(locator);
  await locator.click({ timeout });
  await hideToastNotifications(locator.page());
}

async function clickIfVisibleForVideo(locator: Locator, timeout = 2_000) {
  if (await locator.isVisible({ timeout }).catch(() => false)) {
    await clickForVideo(locator, Math.max(timeout, 5_000));
    return true;
  }
  return false;
}

async function hideToastNotifications(page: Page) {
  await page.evaluate(() => {
    for (const element of Array.from(
      document.querySelectorAll<HTMLElement>(
        '.Toastify, .Toastify__toast-container, .Toastify__toast',
      ),
    )) {
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
      element.style.visibility = 'hidden';
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
        Array.from(card.querySelectorAll<HTMLImageElement>('img')).filter(isInViewport),
      );

      return (
        visibleCards.length > 0 &&
        visibleCardImages.length > 0 &&
        visibleCardImages.every(
          (image) =>
            Boolean(image.currentSrc || image.src) &&
            image.complete &&
            image.naturalWidth > 0 &&
            image.naturalHeight > 0,
        )
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
  await prepareMediaFrame(page);
  await waitForVisibleImagesReady(page);

  await page.screenshot({
    path: path.join(liveDemoMediaDir, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
    ...options,
  });
}

async function prepareMediaFrame(page: Page) {
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

async function chooseFavoritesTag(page: Page) {
  await clickIfVisible(page.getByText('TAGS', { exact: true }), 5_000);
  await clickIfVisible(page.locator('.tag-item[data-tag="Favorites"]'), 10_000);
  await waitForAppSettled(page);
}

async function selectAllPokedexFilter(page: Page) {
  const pokedexActive = await page
    .locator('.toggle-text.active')
    .filter({ hasText: 'POKÉDEX' })
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);

  if (!pokedexActive) {
    await clickIfVisible(page.getByText('POKÉDEX', { exact: true }), 5_000);
  }

  const allPokedexList = page
    .locator('.pokedex-fullwidth-list .pokedex-list-item, .pokedex-lists-menu.one-column .pokedex-list-item')
    .first();
  await expect(allPokedexList).toBeVisible({ timeout: 30_000 });
  await hideToastNotifications(page);
  await allPokedexList.click({ timeout: 10_000 });
  await waitForAppSettled(page);
  await centerPokemonPanel(page);
  await waitForCollectionCardsOrEmpty(page);
  await ensureCollectionContentInViewport(page);
  await forcePokemonPanelCentered(page);
  await waitForCollectionMediaReady(page);
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

async function pauseForVideo(page: Page, duration = videoPauseMs) {
  await prepareMediaFrame(page);
  await waitForVisibleImagesReady(page);
  await page.waitForTimeout(duration);
}

async function chooseFavoritesTagForVideo(page: Page) {
  await clickIfVisibleForVideo(page.getByText('TAGS', { exact: true }), 5_000);
  await page.waitForTimeout(videoActionPauseMs);
  await clickIfVisibleForVideo(page.locator('.tag-item[data-tag="Favorites"]'), 10_000);
  await waitForAppSettled(page);
}

async function sortCollectionByFavoritesForVideo(page: Page) {
  const sortButton = page.locator('.sort-button').first();
  await expect(sortButton).toBeVisible({ timeout: 15_000 });
  await hideToastNotifications(page);
  await clickForVideo(sortButton, 10_000);
  await page.waitForTimeout(videoActionPauseMs);

  await expect(page.locator('.sort-menu-overlay')).toBeVisible({ timeout: 10_000 });
  await clickForVideo(
    page.locator('.sort-menu-overlay .sort-type-button').filter({ hasText: 'FAVORITE' }),
    10_000,
  );
  await expect(page.locator('.sort-menu-overlay')).toHaveCount(0, { timeout: 15_000 });
  await waitForAppSettled(page);
}

async function warmCollectionVideoContext(page: Page) {
  await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);

  await selectAllPokedexFilter(page);
  await chooseFavoritesTag(page);
  await centerPokemonPanel(page);
  await sortCollectionByFavorites(page);
  await centerPokemonPanel(page);
  await waitForCollectionCardsOrEmpty(page);
  await ensureCollectionContentInViewport(page);
  await forcePokemonPanelCentered(page);
  await page.waitForTimeout(100);
  await waitForCollectionMediaReady(page);
}

async function openShinyShadowRaikouOverlayForVideo(page: Page) {
  const searchInput = page.locator('.search-input').first();
  await expect(searchInput).toBeVisible({ timeout: 15_000 });
  await clickForVideo(searchInput, 15_000);
  await page.waitForTimeout(videoActionPauseMs);
  await searchInput.fill('');
  await searchInput.pressSequentially('raikou', { delay: 120 });
  await waitForAppSettled(page);
  await waitForVisibleImagesReady(page, 45_000);
  await page.waitForTimeout(videoActionPauseMs);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const raikouCard = await getPreferredRaikouCard(page);
    try {
      await clickForVideo(raikouCard, 10_000);
      break;
    } catch (error) {
      if (attempt === 4) throw error;
      await page.waitForTimeout(500);
    }
  }

  await expect(page.locator('.instance-overlay')).toBeVisible({ timeout: 15_000 });
  await waitForVisibleImagesReady(page, 45_000);
}

async function performCollectionOverlayVideoFlow(page: Page, recordingStartedAt: number) {
  await page.goto('/pokemon', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);

  await selectAllPokedexFilter(page);
  const trimStartMs = videoTrimStart(recordingStartedAt);
  await pauseForVideo(page, 1_200);

  await chooseFavoritesTagForVideo(page);
  await centerPokemonPanel(page);
  await sortCollectionByFavoritesForVideo(page);
  await centerPokemonPanel(page);
  await waitForCollectionCardsOrEmpty(page);
  await ensureCollectionContentInViewport(page);
  await forcePokemonPanelCentered(page);
  await waitForCollectionMediaReady(page);
  await pauseForVideo(page, 2_000);

  await openShinyShadowRaikouOverlayForVideo(page);
  await pauseForVideo(page, videoFinalPauseMs);

  return { trimStartMs };
}

async function warmSearchVideoContext(page: Page) {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);
  await page.getByRole('button', { name: 'Pokemon' }).click();
  await expect(page.getByPlaceholder('Enter Pokemon name')).toBeVisible({ timeout: 30_000 });
  return await waitForPokemonCatalogReady(page);
}

async function performSearchResultsVideoFlow(page: Page, recordingStartedAt: number) {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await waitForAppSettled(page);

  await page.getByRole('button', { name: 'Pokemon' }).click();
  await expect(page.getByPlaceholder('Enter Pokemon name')).toBeVisible({ timeout: 30_000 });
  const catalogReady = await waitForPokemonCatalogReady(page);
  const trimStartMs = videoTrimStart(recordingStartedAt);
  await pauseForVideo(page, 1_000);

  const pokemonInput = page.getByPlaceholder('Enter Pokemon name');
  await clickForVideo(pokemonInput, 10_000);
  await pokemonInput.fill('');
  await pokemonInput.pressSequentially('Pikachu', { delay: 110 });
  await page.waitForTimeout(videoActionPauseMs);
  await clickIfVisibleForVideo(page.getByRole('button', { name: 'Pikachu', exact: true }), 2_000);
  await page.waitForTimeout(videoActionPauseMs);

  if (await seedStoredLocationFromAccount(page)) {
    await page.waitForTimeout(videoActionPauseMs);
    await clickForVideo(page.getByRole('button', { name: 'Use Current Location' }), 10_000);
  } else {
    const locationInput = page.getByPlaceholder('Enter location');
    await clickForVideo(locationInput, 10_000);
    await locationInput.fill('');
    await locationInput.pressSequentially('Vancouver', { delay: 70 });
    await page.waitForTimeout(videoActionPauseMs);
    await clickIfVisibleForVideo(page.getByText(/Vancouver/i).first(), 10_000);
  }

  await page.waitForTimeout(videoActionPauseMs);
  await clickForVideo(page.getByRole('button', { name: 'Search', exact: true }), 10_000);
  if (!catalogReady) {
    await waitForAnyVisible(page, [
      page.getByText(/No Pokemon data found in the default store/i),
      page.getByText(/Use the Toolbar above/i),
    ], 10_000);
    await pauseForVideo(page, videoFinalPauseMs);
    return { trimStartMs };
  }

  await waitForAnyVisible(page, [
    page.locator('.list-view-container'),
    page.getByText('No Pokemon found matching your criteria.'),
    page.getByText(/No Pokemon data found in the default store/i),
    page.getByText(/Use the Toolbar above/i),
  ]);
  const hasSearchResults = await page.locator('.list-view-container').isVisible().catch(() => false);
  await pauseForVideo(page);

  if (hasSearchResults) {
    await clickForVideo(page.getByRole('button', { name: 'Map view' }), 10_000);
    await waitForAnyVisible(page, [page.locator('.ol-viewport')]);
    await page.waitForTimeout(1_200);
    await pauseForVideo(page, videoFinalPauseMs);
  }

  return { trimStartMs };
}

async function recordVideoClip(
  browser: Browser,
  theme: ThemeMode,
  viewport: ViewportMode,
  flow: VideoFlow,
  testInfo: TestInfo,
) {
  const viewportSize = captureViewports[viewport];
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL ?? 'https://pokegonexus.com',
    viewport: viewportSize,
    serviceWorkers: 'block',
    recordVideo: {
      dir: liveDemoVideoDir,
      size: viewportSize,
    },
  });
  await installVideoPresentationHelpers(context, viewport === 'desktop');
  await context.addInitScript((mode: ThemeMode) => {
    const isLightMode = mode === 'light';
    window.localStorage.setItem('isLightMode', JSON.stringify(isLightMode));
    const applyTheme = () => {
      const root = document.documentElement;
      if (!root) return;

      root.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
      root.style.colorScheme = isLightMode ? 'light' : 'dark';
    };

    applyTheme();
    document.addEventListener('DOMContentLoaded', applyTheme);
    new MutationObserver(applyTheme).observe(document, {
      childList: true,
      subtree: true,
    });
  }, theme);

  const setupPage = await context.newPage();
  const setupVideo = setupPage.video();
  const setupDiagnostics = attachBrowserDiagnostics(setupPage, testInfo);
  const setupBlockedMutations = await installReadOnlyNetworkGuard(setupPage);

  await loginWithDemoAccount(setupPage);
  await prepareCaptureContext(setupPage, theme, viewport);
  if (flow === 'collection-overlay') {
    await warmCollectionVideoContext(setupPage);
  } else {
    await warmSearchVideoContext(setupPage);
  }
  await setupDiagnostics.flush();
  const setupBlockingErrors = setupDiagnostics.blockingErrors();
  await setupPage.close();
  await setupVideo?.delete().catch(() => {});

  const recordingStartedAt = Date.now();
  const page = await context.newPage();
  const diagnostics = attachBrowserDiagnostics(page, testInfo);
  const blockedMutations = [
    ...setupBlockedMutations,
    ...(await installReadOnlyNetworkGuard(page)),
  ];
  let blockingErrors: unknown[] = [];
  let video = page.video();
  let trimStartMs = 0;

  try {
    if (flow === 'collection-overlay') {
      const result = await performCollectionOverlayVideoFlow(page, recordingStartedAt);
      trimStartMs = result.trimStartMs;
    } else {
      const result = await performSearchResultsVideoFlow(page, recordingStartedAt);
      trimStartMs = result.trimStartMs;
    }
  } finally {
    await diagnostics.flush();
    blockingErrors = [
      ...setupBlockingErrors,
      ...diagnostics.blockingErrors(),
    ];
    video = page.video();
    await page.close().catch(() => {});
    await context.close();
  }

  if (video) {
    const finalVideoPath = path.join(liveDemoVideoDir, `${videoName(theme, flow, viewport)}.webm`);
    const rawVideoPath = path.join(liveDemoVideoDir, `${videoName(theme, flow, viewport)}.raw.webm`);
    await video.saveAs(rawVideoPath);
    await video.delete().catch(() => {});
    trimVideoClip(rawVideoPath, finalVideoPath, trimStartMs);
    fs.rmSync(rawVideoPath, { force: true });
  }

  return { blockedMutations, blockingErrors };
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

test.describe('live demo video capture', () => {
  test.setTimeout(900_000);

  test.skip(
    !runLiveVideoCapture,
    'Only run through npm run capture:demo:video:live',
  );
  test.skip(
    !demoUsername || !demoPassword,
    'Set POKEGONEXUS_DEMO_USERNAME and POKEGONEXUS_DEMO_PASSWORD to capture live video',
  );

  test(
    'records PokeGo Nexus demo flows with a real read-only demo account',
    async ({ browser }, testInfo) => {
      fs.rmSync(liveDemoVideoDir, { recursive: true, force: true });
      fs.mkdirSync(liveDemoVideoDir, { recursive: true });
      const blockedMutations: BlockedMutation[] = [];
      const blockingErrors: unknown[] = [];

      for (const theme of videoThemes) {
        for (const viewport of videoViewports) {
          for (const flow of videoFlows) {
            const result = await recordVideoClip(
              browser,
              theme,
              viewport,
              flow,
              testInfo,
            );
            blockedMutations.push(...result.blockedMutations);
            blockingErrors.push(...result.blockingErrors);
          }
        }
      }

      expect(
        blockedMutations,
        `live video capture blocked unexpected account-mutating requests:\n${JSON.stringify(blockedMutations, null, 2)}`,
      ).toEqual([]);

      expect(
        blockingErrors,
        `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
      ).toEqual([]);
    },
  );
});

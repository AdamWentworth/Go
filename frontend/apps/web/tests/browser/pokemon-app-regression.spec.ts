import { expect, test } from '@playwright/test';

import { attachBrowserDiagnostics } from './support/diagnostics';
import { installE2eRoutes } from './support/e2eRoutes';
import {
  countIndexedDbStore,
  disconnectPokemonGridLayoutProbe,
  disconnectLoadingOverlayProbe,
  dispatchTouchSwipe,
  expectActivePokemonView,
  expectNoPokemonGridOverlapObserved,
  expectNoLoadingOverlaySeen,
  expectVisiblePokemonCardsDoNotOverlap,
  installPokemonGridLayoutProbe,
  installLoadingOverlayProbe,
  openCaughtPokemonList,
  openPokemonPage,
} from './support/pokemonApp';

test.describe('pokemon app browser regressions', () => {
  test('loads theme loading spinner WebM assets from shared media in every browser project', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await page.goto('/');

      const assetResults = await page.evaluate(async () => {
        type SpinnerVideoInspection = {
          src: string;
          byteLength: number;
          canDecodeWebM: boolean;
          width: number;
          height: number;
          cornerAlpha: number;
          lowAlphaPixels: number;
          maxAlpha: number;
        };

        const canDecodeWebM = Boolean(
          document.createElement('video').canPlayType('video/webm; codecs="vp9"') ||
            document.createElement('video').canPlayType('video/webm'),
        );

        const inspectVideo = async (src: string): Promise<SpinnerVideoInspection> => {
          const response = await fetch(src);
          const byteLength = (await response.arrayBuffer()).byteLength;
          if (!response.ok) {
            throw new Error(`Could not fetch ${src}: ${response.status}`);
          }

          if (!canDecodeWebM) {
            return {
              src,
              byteLength,
              canDecodeWebM,
              width: 0,
              height: 0,
              cornerAlpha: 0,
              lowAlphaPixels: 0,
              maxAlpha: 0,
            };
          }

          return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.onloadeddata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const context = canvas.getContext('2d');
              if (!context) {
                reject(new Error('Could not inspect spinner video transparency'));
                return;
              }

              context.drawImage(video, 0, 0);
              const imageData = context.getImageData(
                0,
                0,
                video.videoWidth,
                video.videoHeight,
              ).data;
              const cornerAlpha = context.getImageData(0, 0, 1, 1).data[3];
              let lowAlphaPixels = 0;
              let maxAlpha = 0;
              for (let index = 3; index < imageData.length; index += 4) {
                const alpha = imageData[index];
                if (alpha > 0 && alpha < 64) {
                  lowAlphaPixels += 1;
                }
                maxAlpha = Math.max(maxAlpha, alpha);
              }

              resolve({
                src,
                byteLength,
                canDecodeWebM,
                width: video.videoWidth,
                height: video.videoHeight,
                cornerAlpha,
                lowAlphaPixels,
                maxAlpha,
              });
            };
            video.onerror = () => reject(new Error(`Could not decode ${src}`));
            video.src = src;
            video.load();
          });
        };

        return Promise.all([
          inspectVideo('/media/media/loading_spinner.webm'),
          inspectVideo('/media/media/loading_spinner_light.webm'),
        ]);
      });

      expect(assetResults).toMatchObject([
        {
          src: '/media/media/loading_spinner.webm',
        },
        {
          src: '/media/media/loading_spinner_light.webm',
        },
      ]);
      for (const result of assetResults) {
        expect(result.byteLength).toBeGreaterThan(1_000);

        if (result.canDecodeWebM) {
          expect(result.width).toBeGreaterThanOrEqual(80);
          expect(result.height).toBeGreaterThanOrEqual(80);
          expect(result.maxAlpha).toBeGreaterThan(200);
        }
      }
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('renders the boot loading overlay as video-only shared media', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);
    let releasePokemonModule: () => void = () => undefined;
    const releaseBlockedPokemonModule = new Promise<void>((resolve) => {
      releasePokemonModule = resolve;
    });
    let resolvePokemonModuleRequested: () => void = () => undefined;
    const pokemonModuleRequested = new Promise<void>((resolve) => {
      resolvePokemonModuleRequested = resolve;
    });

    try {
      await installE2eRoutes(page);
      await page.route('**/src/pages/Pokemon/Pokemon.tsx*', async (route) => {
        resolvePokemonModuleRequested();
        await releaseBlockedPokemonModule;
        await route.continue();
      });

      const response = await page.goto('/pokemon', { waitUntil: 'commit' });
      expect(response?.ok(), '/pokemon document response should be OK').toBe(true);
      await pokemonModuleRequested;

      const overlay = page.locator('.app-loading-overlay');
      await expect(overlay).toBeVisible();
      await expect(overlay.locator('.loading-text')).toHaveCount(0);
      await expect(overlay.getByText(/^Loading/)).toHaveCount(0);

      const videos = overlay.locator('video.spinner-video');
      await expect(videos).toHaveCount(2);
      await expect(
        overlay.locator('source[src="/media/media/loading_spinner.webm"]'),
      ).toHaveCount(1);
      await expect(
        overlay.locator('source[src="/media/media/loading_spinner_light.webm"]'),
      ).toHaveCount(1);
      await expect(overlay.locator('source[src^="/assets/loading_spinner"]')).toHaveCount(0);

      const videoAttributes = await videos.evaluateAll((elements) =>
        elements.map((element) => {
          const video = element as HTMLVideoElement;
          return {
            ariaHidden: video.getAttribute('aria-hidden'),
            loop: video.loop,
            muted: video.muted,
            playsInline: video.hasAttribute('playsinline'),
            preload: video.preload,
            source: video.querySelector('source')?.getAttribute('src'),
            tabIndex: video.tabIndex,
          };
        }),
      );
      expect(videoAttributes).toEqual([
        {
          ariaHidden: 'true',
          loop: true,
          muted: true,
          playsInline: true,
          preload: 'auto',
          source: '/media/media/loading_spinner.webm',
          tabIndex: -1,
        },
        {
          ariaHidden: 'true',
          loop: true,
          muted: true,
          playsInline: true,
          preload: 'auto',
          source: '/media/media/loading_spinner_light.webm',
          tabIndex: -1,
        },
      ]);

      const visualLayerStyles = await overlay.locator('.spinner-visual-shell').evaluate(
        (shellElement) => {
          const shellStyle = window.getComputedStyle(shellElement);
          const videoStyles = Array.from(
            shellElement.querySelectorAll('video.spinner-video'),
          ).map((videoElement) => {
            const style = window.getComputedStyle(videoElement);
            return {
              backgroundColor: style.backgroundColor,
              boxShadow: style.boxShadow,
              filter: style.filter,
              objectFit: style.objectFit,
            };
          });

          return {
            shell: {
              backgroundColor: shellStyle.backgroundColor,
              boxShadow: shellStyle.boxShadow,
              filter: shellStyle.filter,
            },
            videos: videoStyles,
          };
        },
      );
      expect(visualLayerStyles).toEqual({
        shell: {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          boxShadow: 'none',
          filter: 'none',
        },
        videos: [
          {
            backgroundColor: 'rgba(0, 0, 0, 0)',
            boxShadow: 'none',
            filter: 'none',
            objectFit: 'contain',
          },
          {
            backgroundColor: 'rgba(0, 0, 0, 0)',
            boxShadow: 'none',
            filter: 'none',
            objectFit: 'contain',
          },
        ],
      });
    } finally {
      releasePokemonModule();
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('switches between Pokemon menus without replaying the boot loading overlay', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);
      await expectActivePokemonView(page, 'Pokémon');
      await installLoadingOverlayProbe(page);

      await page.getByText('TAGS', { exact: true }).click();
      await expectActivePokemonView(page, 'TAGS');
      await expectNoLoadingOverlaySeen(page);

      await page.getByText('POKÉDEX', { exact: true }).click();
      await expectActivePokemonView(page, 'POKÉDEX');
      await expectNoLoadingOverlaySeen(page);

      await page.getByText('Pokémon', { exact: true }).click();
      await expectActivePokemonView(page, 'Pokémon');
      await expectNoLoadingOverlaySeen(page);
    } finally {
      await disconnectLoadingOverlayProbe(page);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('keeps the Pokemon grid scroll area bounded to the viewport', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);

      const metrics = await page.evaluate(() => {
        const wrapper = document.querySelector('.grid-wrapper');
        const container = document.querySelector('.grid-container');
        if (!wrapper || !container) {
          throw new Error('Pokemon grid did not render expected scroll elements');
        }

        const wrapperRect = wrapper.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          wrapperHeight: wrapperRect.height,
          containerHeight: containerRect.height,
          wrapperOverflowY: window.getComputedStyle(wrapper).overflowY,
          containerOverflowY: window.getComputedStyle(container).overflowY,
        };
      });

      const expectedOffset = metrics.viewportWidth <= 480 ? 130 : 164;
      expect(
        Math.abs(metrics.wrapperHeight - (metrics.viewportHeight - expectedOffset)),
      ).toBeLessThanOrEqual(2);
      expect(metrics.containerHeight).toBeCloseTo(metrics.wrapperHeight, 0);
      expect(metrics.containerOverflowY).toBe('auto');
      expect(metrics.wrapperOverflowY).toBe('visible');
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('keeps typed Pokemon menu search text visible without replaying the loader', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);
      await installLoadingOverlayProbe(page);

      const searchInput = page.locator('.search-input');
      await searchInput.click();
      await searchInput.pressSequentially('pi', { delay: 60 });
      await expect(searchInput).toHaveValue('pi');
      await expectNoLoadingOverlaySeen(page);
      await expect(page.getByRole('button', { name: /View Pikachu details/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /View Caterpie details/i })).toHaveCount(0);

      const contrast = await searchInput.evaluate((element) => {
        const parseRgb = (value: string) => {
          const match = value.match(/rgba?\(([^)]+)\)/);
          if (!match) return null;
          const [r, g, b] = match[1]
            .split(',')
            .slice(0, 3)
            .map((part) => Number.parseFloat(part.trim()));
          return [r, g, b] as const;
        };
        const luminance = ([r, g, b]: readonly number[]) => {
          const channels = [r, g, b].map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.03928
              ? normalized / 12.92
              : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        };

        const styles = window.getComputedStyle(element);
        const textRgb = parseRgb(styles.webkitTextFillColor || styles.color);
        const backgroundRgb = parseRgb(styles.backgroundColor);
        if (!textRgb || !backgroundRgb) {
          throw new Error(
            `Could not parse search input colors: text=${styles.color}, fill=${styles.webkitTextFillColor}, background=${styles.backgroundColor}`,
          );
        }

        const textLuminance = luminance(textRgb);
        const backgroundLuminance = luminance(backgroundRgb);
        const lighter = Math.max(textLuminance, backgroundLuminance);
        const darker = Math.min(textLuminance, backgroundLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      });

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    } finally {
      await disconnectLoadingOverlayProbe(page);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('keeps visible Pokemon cards non-overlapping through boot and refresh', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await installPokemonGridLayoutProbe(page);
      await openPokemonPage(page);
      await expectVisiblePokemonCardsDoNotOverlap(page);
      await expectNoPokemonGridOverlapObserved(page);

      const response = await page.reload({ waitUntil: 'domcontentloaded' });
      expect(response?.ok(), '/pokemon reload response should be OK').toBe(true);
      await expect(page.locator('[role="button"][aria-label^="View "]').first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator('.pokemon-grid-cell.visible').first()).toBeVisible();
      await expect(page.locator('.app-loading-overlay')).toHaveCount(0);
      await expectVisiblePokemonCardsDoNotOverlap(page);
      await expectNoPokemonGridOverlapObserved(page);
    } finally {
      await disconnectPokemonGridLayoutProbe(page).catch(() => undefined);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('opens a caught instance overlay with scroll-safe layout', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      const { firstCaughtCard } = await openCaughtPokemonList(page);
      await firstCaughtCard.click();

      const overlay = page.locator('.instance-overlay.caught-mode');
      await expect(overlay).toBeVisible();
      await expect(page.locator('.caught-scroll')).toBeVisible();
      await expect(page.locator('.caught-instance')).toBeVisible();
      await expect(page.locator('.app-loading-overlay')).toHaveCount(0);

      const metrics = await page.evaluate(() => {
        const overlay = document.querySelector('.instance-overlay.caught-mode');
        const scroll = document.querySelector('.caught-scroll');
        const column = document.querySelector('.caught-column');
        const content = document.querySelector('.caught-instance');
        if (!overlay || !scroll || !column || !content) {
          throw new Error('Caught overlay did not render expected elements');
        }

        return {
          viewportHeight: window.innerHeight,
          overlayHeight: overlay.getBoundingClientRect().height,
          scrollMinHeight: window.getComputedStyle(scroll).minHeight,
          scrollHeight: overlay.scrollHeight,
          clientHeight: overlay.clientHeight,
          columnWidth: column.getBoundingClientRect().width,
          contentWidth: content.getBoundingClientRect().width,
        };
      });

      expect(metrics.scrollMinHeight).not.toBe('100dvh');
      expect(metrics.overlayHeight).toBeGreaterThan(metrics.viewportHeight * 0.9);
      expect(metrics.clientHeight).toBeGreaterThan(0);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);
      expect(metrics.columnWidth).toBeGreaterThanOrEqual(metrics.contentWidth);

      await page.getByRole('button', { name: 'Close' }).click();
      await expect(overlay).toHaveCount(0);
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('keeps menu slide transition after closing a Pokemon overlay', async ({
    page,
  }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      const { firstCaughtCard } = await openCaughtPokemonList(page);
      await firstCaughtCard.click();

      const overlay = page.locator('.instance-overlay.caught-mode');
      await expect(overlay).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(overlay).toHaveCount(0);

      const slider = page.locator('.view-slider');
      await expect
        .poll(() =>
          slider.evaluate((element) => window.getComputedStyle(element).transitionProperty),
        )
        .toContain('transform');

      const sliderContainer = page.locator('.view-slider-container');
      const sliderWidth = await sliderContainer.evaluate((element) => element.clientWidth);
      const pokemonTransform = await slider.evaluate(
        (element) => (element as HTMLElement).style.transform,
      );

      await page.getByText('TAGS', { exact: true }).click();
      await expectActivePokemonView(page, 'TAGS');
      await expect
        .poll(() =>
          slider.evaluate((element) =>
            (element as HTMLElement).style.transform.replace(/\s+/g, ''),
          ),
        )
        .toBe(`translate3d(-${sliderWidth * 2}px,0px,0px)`);
      const transitionProperty = await slider.evaluate(
        (element) => window.getComputedStyle(element).transitionProperty,
      );
      const tagsTransform = await slider.evaluate(
        (element) => (element as HTMLElement).style.transform,
      );
      expect(tagsTransform).not.toBe(pokemonTransform);
      expect(transitionProperty).toContain('transform');
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('keeps vertical caught overlay touches from switching menus on mobile', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile, 'touch scroll coverage only runs on mobile browser projects');

    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      const { firstCaughtCard } = await openCaughtPokemonList(page);
      await expectActivePokemonView(page, 'Pokémon');
      await firstCaughtCard.click();

      const overlay = page.locator('.instance-overlay.caught-mode');
      await expect(overlay).toBeVisible();
      await overlay.evaluate((element) => {
        const spacer = document.createElement('div');
        spacer.setAttribute('data-e2e-overlay-scroll-spacer', 'true');
        spacer.style.height = '480px';
        spacer.style.pointerEvents = 'none';
        const scrollContent =
          element.querySelector('.caught-column') ?? element.querySelector('.caught-scroll');
        (scrollContent ?? element).appendChild(spacer);
      });
      await expect
        .poll(() =>
          overlay.evaluate((element) => ({
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
            scrollTop: element.scrollTop,
          })),
        )
        .toMatchObject({
          scrollTop: 0,
        });

      const scrollMetrics = await overlay.evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }));
      expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);

      const box = await overlay.boundingBox();
      expect(box, 'caught overlay should be measurable').not.toBeNull();
      if (!box) return;

      const x = Math.round(box.x + box.width * 0.5);
      await dispatchTouchSwipe(
        overlay,
        { clientX: x, clientY: Math.round(box.y + box.height * 0.78) },
        { clientX: x, clientY: Math.round(box.y + box.height * 0.24) },
      );

      await expect(overlay).toBeVisible();
      await expectActivePokemonView(page, 'Pokémon');
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('persists Pokemon boot data into IndexedDB', async ({ page }, testInfo) => {
    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);

      await expect
        .poll(() => countIndexedDbStore(page, 'variantsDB', 'variants'))
        .toBeGreaterThan(0);
      await expect
        .poll(() => countIndexedDbStore(page, 'instancesDB', 'instances'))
        .toBeGreaterThan(0);
    } finally {
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });

  test('changes Pokemon views with horizontal touch swipes on mobile', async ({
    page,
    isMobile,
  }, testInfo) => {
    test.skip(!isMobile, 'touch swipe coverage only runs on mobile browser projects');

    const diagnostics = attachBrowserDiagnostics(page, testInfo);

    try {
      await openPokemonPage(page);
      await expectActivePokemonView(page, 'Pokémon');
      await installLoadingOverlayProbe(page);

      const slider = page.locator('.view-slider-container');
      const box = await slider.boundingBox();
      expect(box, 'view slider should be measurable').not.toBeNull();
      if (!box) return;

      const y = Math.round(box.y + box.height * 0.45);
      await dispatchTouchSwipe(
        slider,
        { clientX: Math.round(box.x + box.width * 0.82), clientY: y },
        { clientX: Math.round(box.x + box.width * 0.18), clientY: y },
      );
      await expectActivePokemonView(page, 'TAGS');
      await expectNoLoadingOverlaySeen(page);

      await dispatchTouchSwipe(
        slider,
        { clientX: Math.round(box.x + box.width * 0.18), clientY: y },
        { clientX: Math.round(box.x + box.width * 0.82), clientY: y },
      );
      await expectActivePokemonView(page, 'Pokémon');
      await expectNoLoadingOverlaySeen(page);
    } finally {
      await disconnectLoadingOverlayProbe(page);
      await diagnostics.flush();
    }

    const blockingErrors = diagnostics.blockingErrors();
    expect(
      blockingErrors,
      `browser diagnostics should not include runtime errors:\n${JSON.stringify(blockingErrors, null, 2)}`,
    ).toEqual([]);
  });
});
